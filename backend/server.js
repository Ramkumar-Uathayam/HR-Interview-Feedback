if (!AbortSignal.any) {
    AbortSignal.any = function (signals) {
        const controller = new AbortController();

        function onAbort() {
            controller.abort();
            cleanup();
        }

        function cleanup() {
            for (const signal of signals) {
                signal.removeEventListener('abort', onAbort);
            }
        }

        for (const signal of signals) {
            signal.addEventListener('abort', onAbort);
        }

        if (signals.some(signal => signal.aborted)) {
            controller.abort();
        }

        return controller.signal;
    };
}

const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3401;
const QUIZ_SETTINGS_KEY = 'default';
const rootDir = __dirname.endsWith('backend') ? path.resolve(__dirname, '..') : __dirname;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.use((req, res, next) => {
    const ext = path.extname(req.url);
    if (ext === '.ts' || ext === '.tsx') {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});

app.use(express.static(rootDir));

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function getPool() {
    return sql.connect(dbConfig);
}

function normalizeQuestion(row) {
    return {
        id: row.id,
        set: row.set_name,
        type: row.question_type,
        question: row.question_text,
        imageUrl: row.image_url || undefined,
        memoryWords: row.memory_words ? JSON.parse(row.memory_words) : undefined,
        options: {
            A: row.option_a || '',
            B: row.option_b || '',
            C: row.option_c || '',
            D: row.option_d || ''
        },
        correctAnswer: row.correct_answer,
        isActive: row.is_active === true || row.is_active === 1,
        sortOrder: row.sort_order,
        sourceSheet: row.source_sheet || undefined
    };
}

async function initDb() {
    try {
        const pool = await getPool();

        await pool.request().batch(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrfeedbacks' AND xtype='U')
            BEGIN
                CREATE TABLE hrfeedbacks (
                    id VARCHAR(50) PRIMARY KEY,
                    candidate_name NVARCHAR(255),
                    mobile_number CHAR(10),
                    designation NVARCHAR(100),
                    department NVARCHAR(100),
                    address NVARCHAR(MAX),
                    submission_date NVARCHAR(20),
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
                    referral BIT,
                    qualitative NVARCHAR(MAX),
                    created_at DATETIME DEFAULT GETDATE()
                )
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
                )
            END

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrquiz_questions' AND xtype='U')
            BEGIN
                CREATE TABLE hrquiz_questions (
                    id VARCHAR(100) PRIMARY KEY,
                    set_name NVARCHAR(20) NOT NULL,
                    question_type NVARCHAR(50) NOT NULL,
                    question_text NVARCHAR(MAX) NOT NULL,
                    image_url NVARCHAR(MAX) NULL,
                    memory_words NVARCHAR(MAX) NULL,
                    option_a NVARCHAR(MAX) NULL,
                    option_b NVARCHAR(MAX) NULL,
                    option_c NVARCHAR(MAX) NULL,
                    option_d NVARCHAR(MAX) NULL,
                    correct_answer NVARCHAR(MAX) NOT NULL,
                    is_active BIT NOT NULL DEFAULT 1,
                    sort_order INT NOT NULL DEFAULT 0,
                    source_sheet NVARCHAR(255) NULL,
                    created_at DATETIME NOT NULL DEFAULT GETDATE(),
                    updated_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END

            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hrquiz_settings' AND xtype='U')
            BEGIN
                CREATE TABLE hrquiz_settings (
                    settings_key NVARCHAR(50) PRIMARY KEY,
                    timer_per_question INT NOT NULL DEFAULT 15,
                    is_active BIT NOT NULL DEFAULT 0,
                    active_set NVARCHAR(20) NOT NULL DEFAULT 'A',
                    enabled_sets NVARCHAR(MAX) NULL,
                    updated_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END

            IF NOT EXISTS (SELECT 1 FROM hrquiz_settings WHERE settings_key = '${QUIZ_SETTINGS_KEY}')
            BEGIN
                INSERT INTO hrquiz_settings (settings_key, timer_per_question, is_active, active_set, enabled_sets)
                VALUES ('${QUIZ_SETTINGS_KEY}', 15, 0, 'A', '[]')
            END
        `);

        console.log('Connected to MSSQL Database');
    } catch (err) {
        console.warn('Database connection failed. API routes will retry per request.', err.message);
    }
}

initDb();

app.get('/api/feedback', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM hrfeedbacks ORDER BY created_at DESC');

        const feedbacks = result.recordset.map(row => ({
            id: row.id,
            candidateName: row.candidate_name,
            mobileNumber: row.mobile_number,
            designation: row.designation,
            department: row.department,
            address: row.address,
            date: row.submission_date,
            ratings: {
                q1_clarity: row.q1_clarity,
                q2_communication: row.q2_communication,
                q3_expectations: row.q3_expectations,
                q4_ambience: row.q4_ambience,
                q5_alignment: row.q5_alignment,
                q6_professionalism: row.q6_professionalism,
                q7_waiting_period: row.q7_waiting_period,
                q8_opportunity: row.q8_opportunity,
                q9_transparency: row.q9_transparency,
                q10_overall: row.q10_overall
            },
            referral: row.referral === true || row.referral === 1,
            qualitative: row.qualitative
        }));

        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedback', async (req, res) => {
    const feedback = req.body;
    if (!feedback || !feedback.id) {
        return res.status(400).json({ error: 'Missing feedback data or ID' });
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.VarChar(50), feedback.id)
            .input('candidate_name', sql.NVarChar(255), feedback.candidateName)
            .input('mobile_number', sql.Char(10), feedback.mobileNumber)
            .input('designation', sql.NVarChar(100), feedback.designation)
            .input('department', sql.NVarChar(100), feedback.department)
            .input('address', sql.NVarChar(sql.MAX), feedback.address)
            .input('submission_date', sql.NVarChar(20), feedback.date)
            .input('q1', sql.Int, feedback.ratings.q1_clarity)
            .input('q2', sql.Int, feedback.ratings.q2_communication)
            .input('q3', sql.Int, feedback.ratings.q3_expectations)
            .input('q4', sql.Int, feedback.ratings.q4_ambience)
            .input('q5', sql.Int, feedback.ratings.q5_alignment)
            .input('q6', sql.Int, feedback.ratings.q6_professionalism)
            .input('q7', sql.Int, feedback.ratings.q7_waiting_period)
            .input('q8', sql.Int, feedback.ratings.q8_opportunity)
            .input('q9', sql.Int, feedback.ratings.q9_transparency)
            .input('q10', sql.Int, feedback.ratings.q10_overall)
            .input('referral', sql.Bit, feedback.referral ? 1 : 0)
            .input('qualitative', sql.NVarChar(sql.MAX), feedback.qualitative)
            .query(`
                INSERT INTO hrfeedbacks (
                    id, candidate_name, mobile_number, designation, department, address, submission_date,
                    q1_clarity, q2_communication, q3_expectations, q4_ambience, q5_alignment,
                    q6_professionalism, q7_waiting_period, q8_opportunity, q9_transparency,
                    q10_overall, referral, qualitative
                )
                VALUES (
                    @id, @candidate_name, @mobile_number, @designation, @department, @address, @submission_date,
                    @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10, @referral, @qualitative
                )
            `);

        res.status(201).json({ id: feedback.id });
    } catch (err) {
        console.error('Feedback save error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/quiz/questions', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT *
            FROM hrquiz_questions
            ORDER BY set_name ASC, sort_order ASC, created_at ASC
        `);

        res.json(result.recordset.map(normalizeQuestion));
    } catch (err) {
        res.status(500).json({ error: 'Failed to load quiz questions', details: err.message });
    }
});

app.put('/api/quiz/questions', async (req, res) => {
    const questions = Array.isArray(req.body?.questions) ? req.body.questions : null;
    if (!questions) {
        return res.status(400).json({ error: 'Questions payload is required' });
    }

    let transaction;

    try {
        const pool = await getPool();
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        await new sql.Request(transaction).query('DELETE FROM hrquiz_questions');

        for (const [index, question] of questions.entries()) {
            await new sql.Request(transaction)
                .input('id', sql.VarChar(100), question.id)
                .input('set_name', sql.NVarChar(20), question.set || 'A')
                .input('question_type', sql.NVarChar(50), question.type || 'MULTIPLE_CHOICE')
                .input('question_text', sql.NVarChar(sql.MAX), question.question || '')
                .input('image_url', sql.NVarChar(sql.MAX), question.imageUrl || null)
                .input('memory_words', sql.NVarChar(sql.MAX), question.memoryWords ? JSON.stringify(question.memoryWords) : null)
                .input('option_a', sql.NVarChar(sql.MAX), question.options?.A || '')
                .input('option_b', sql.NVarChar(sql.MAX), question.options?.B || '')
                .input('option_c', sql.NVarChar(sql.MAX), question.options?.C || '')
                .input('option_d', sql.NVarChar(sql.MAX), question.options?.D || '')
                .input('correct_answer', sql.NVarChar(sql.MAX), question.correctAnswer || '')
                .input('is_active', sql.Bit, question.isActive === false ? 0 : 1)
                .input('sort_order', sql.Int, Number.isInteger(question.sortOrder) ? question.sortOrder : index)
                .input('source_sheet', sql.NVarChar(255), question.sourceSheet || null)
                .query(`
                    INSERT INTO hrquiz_questions (
                        id, set_name, question_type, question_text, image_url, memory_words,
                        option_a, option_b, option_c, option_d, correct_answer, is_active,
                        sort_order, source_sheet, updated_at
                    )
                    VALUES (
                        @id, @set_name, @question_type, @question_text, @image_url, @memory_words,
                        @option_a, @option_b, @option_c, @option_d, @correct_answer, @is_active,
                        @sort_order, @source_sheet, GETDATE()
                    )
                `);
        }

        await transaction.commit();
        res.json({ success: true, count: questions.length });
    } catch (err) {
        if (transaction) {
            await transaction.rollback();
        }
        res.status(500).json({ error: 'Failed to save quiz questions', details: err.message });
    }
});

app.get('/api/quiz/settings', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('settings_key', sql.NVarChar(50), QUIZ_SETTINGS_KEY)
            .query(`
                SELECT timer_per_question, is_active, active_set, enabled_sets
                FROM hrquiz_settings
                WHERE settings_key = @settings_key
            `);

        const row = result.recordset[0];
        res.json({
            timerPerQuestion: row?.timer_per_question ?? 15,
            isActive: row?.is_active === true || row?.is_active === 1,
            activeSet: row?.active_set || 'A',
            enabledSets: row?.enabled_sets ? JSON.parse(row.enabled_sets) : []
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to load quiz settings', details: err.message });
    }
});

app.put('/api/quiz/settings', async (req, res) => {
    const settings = req.body || {};
    const enabledSets = Array.isArray(settings.enabledSets) ? settings.enabledSets : [];

    try {
        const pool = await getPool();
        await pool.request()
            .input('settings_key', sql.NVarChar(50), QUIZ_SETTINGS_KEY)
            .input('timer_per_question', sql.Int, Number(settings.timerPerQuestion) || 15)
            .input('is_active', sql.Bit, settings.isActive ? 1 : 0)
            .input('active_set', sql.NVarChar(20), settings.activeSet || 'A')
            .input('enabled_sets', sql.NVarChar(sql.MAX), JSON.stringify(enabledSets))
            .query(`
                MERGE hrquiz_settings AS target
                USING (SELECT @settings_key AS settings_key) AS source
                ON target.settings_key = source.settings_key
                WHEN MATCHED THEN
                    UPDATE SET
                        timer_per_question = @timer_per_question,
                        is_active = @is_active,
                        active_set = @active_set,
                        enabled_sets = @enabled_sets,
                        updated_at = GETDATE()
                WHEN NOT MATCHED THEN
                    INSERT (settings_key, timer_per_question, is_active, active_set, enabled_sets, updated_at)
                    VALUES (@settings_key, @timer_per_question, @is_active, @active_set, @enabled_sets, GETDATE());
            `);

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save quiz settings', details: err.message });
    }
});

app.get('/api/quiz/results', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT *
            FROM hrquiz_results
            ORDER BY submission_date DESC, score DESC
        `);

        const results = result.recordset.map(row => ({
            username: row.username,
            mobileNumber: row.mobile_number,
            score: row.score,
            totalQuestions: row.total_questions,
            set: row.quiz_set || 'A',
            date: row.submission_date instanceof Date ? row.submission_date.toISOString() : new Date(row.submission_date).toISOString()
        }));

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Database Error', details: err.message });
    }
});

app.post('/api/quiz/results', async (req, res) => {
    const result = req.body;
    if (!result || !result.username) {
        return res.status(400).json({ error: 'Invalid Data' });
    }

    try {
        const pool = await getPool();
        await pool.request()
            .input('username', sql.NVarChar(100), result.username)
            .input('mobile_number', sql.Char(10), result.mobileNumber)
            .input('score', sql.Int, result.score)
            .input('total_questions', sql.Int, result.totalQuestions)
            .input('quiz_set', sql.NVarChar(20), result.set || 'A')
            .query(`
                INSERT INTO hrquiz_results (username, mobile_number, score, total_questions, quiz_set)
                VALUES (@username, @mobile_number, @score, @total_questions, @quiz_set)
            `);

        res.status(201).json({ success: true });
    } catch (err) {
        console.error('Quiz save error:', err.message);
        res.status(500).json({ error: 'Save Failed', details: err.message });
    }
});

app.all(/^\/api\/?.*/, (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `API endpoint ${req.method} ${req.url} does not exist.`
    });
});

app.use(express.static(rootDir));

app.get(/^(?!\/api).*/, (req, res) => {
    const fileExt = path.extname(req.url);
    if (fileExt && fileExt !== '.html') {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(rootDir, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running: http://localhost:${PORT}`);
    console.log(`Serving files from: ${rootDir}`);
});
