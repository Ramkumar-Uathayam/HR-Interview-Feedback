
-- SQL Schema for Ramraj Interview Insight
-- Compatible with Microsoft SQL Server (MSSQL)

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='feedbacks' AND xtype='U')
BEGIN
    CREATE TABLE feedbacks (
        id VARCHAR(50) PRIMARY KEY,
        candidate_name NVARCHAR(255) NOT NULL,
        mobile_number CHAR(10) NOT NULL,
        designation NVARCHAR(100) NOT NULL,
        department NVARCHAR(100) NOT NULL,
        address NVARCHAR(MAX),
        submission_date NVARCHAR(20),
        
        -- Evaluation Ratings (1-5)
        q1_clarity INT,
        q2_communication INT,
        q3_expectations INT,
        q4_ambience INT,
        q5_alignment INT,
        q6_professionalism INT,
        q7_waiting_period INT,
        q8_opportunity INT,
        q9_transparency INT,
        q10_overall INT,
        
        -- Referral & Qualitative
        referral BIT,
        qualitative NVARCHAR(MAX),
        
        -- System metadata
        created_at DATETIME DEFAULT GETDATE()
    );

    -- Indices for faster HR reporting
    CREATE INDEX idx_department ON feedbacks(department);
    CREATE INDEX idx_designation ON feedbacks(designation);
    CREATE INDEX idx_date ON feedbacks(submission_date);
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrquiz_questions' AND xtype='U')
BEGIN
    CREATE TABLE hrquiz_questions (
        id VARCHAR(100) PRIMARY KEY,
        set_name NVARCHAR(20) NOT NULL,
        question_type NVARCHAR(50) NOT NULL,
        question_text NVARCHAR(MAX) NOT NULL,
        image_url NVARCHAR(MAX),
        memory_words NVARCHAR(MAX),
        option_a NVARCHAR(MAX),
        option_b NVARCHAR(MAX),
        option_c NVARCHAR(MAX),
        option_d NVARCHAR(MAX),
        correct_answer NVARCHAR(MAX) NOT NULL,
        is_active BIT NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        source_sheet NVARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
    );

    CREATE INDEX idx_hrquiz_questions_set ON hrquiz_questions(set_name);
    CREATE INDEX idx_hrquiz_questions_active ON hrquiz_questions(is_active);
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrquiz_settings' AND xtype='U')
BEGIN
    CREATE TABLE hrquiz_settings (
        settings_key NVARCHAR(50) PRIMARY KEY,
        timer_per_question INT NOT NULL DEFAULT 15,
        is_active BIT NOT NULL DEFAULT 0,
        active_set NVARCHAR(20) NOT NULL DEFAULT 'A',
        enabled_sets NVARCHAR(MAX),
        updated_at DATETIME DEFAULT GETDATE()
    );

    INSERT INTO hrquiz_settings (settings_key, timer_per_question, is_active, active_set, enabled_sets)
    VALUES ('default', 15, 0, 'A', '[]');
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrquiz_results' AND xtype='U')
BEGIN
    CREATE TABLE hrquiz_results (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(100) NOT NULL,
        mobile_number CHAR(10) NOT NULL,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        quiz_set NVARCHAR(20) NOT NULL DEFAULT 'A',
        submission_date DATETIME NOT NULL DEFAULT GETDATE()
    );

    CREATE INDEX idx_hrquiz_results_set_date ON hrquiz_results(quiz_set, submission_date DESC);
END
