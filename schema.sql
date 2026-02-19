
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
