if (!AbortSignal.any) {
    AbortSignal.any = function (signals) {
        const controller = new AbortController();

        function onAbort() {
            controller.abort();
            cleanup();
        }

        function cleanup() {
            for (const s of signals) {
                s.removeEventListener("abort", onAbort);
            }
        }

        for (const s of signals) {
            s.addEventListener("abort", onAbort);
        }

        if (signals.some(s => s.aborted)) {
            controller.abort();
        }

        return controller.signal;
    };
}


const express = require('express')
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3401;

/**
 * Robustly resolve the project root directory.
 * If this script is in a 'backend' subfolder, go up one level.
 */
const rootDir = __dirname.endsWith('backend') 
    ? path.resolve(__dirname, '..') 
    : __dirname;

// Global Middleware
app.use(cors());
app.use(express.json());

// Request Logger - Helps debug if requests are reaching the server
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 1. MIME Type Middleware for TSX/TS files
app.use((req, res, next) => {
    const ext = path.extname(req.url);
    if (ext === '.ts' || ext === '.tsx') {
        res.setHeader('Content-Type', 'application/javascript');
    }
    next();
});



// Serve static files from the project root directory
app.use(express.static(rootDir));
// Database Configuration provided by user
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Use true for Azure
        trustServerCertificate: true // Useful for self-signed certificates
    }
};

// Initialize Database Table
async function initDb() {
    try {
        let pool = await sql.connect(dbConfig);
        // await pool.request().query(`
        //     IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='feedbacks' AND xtype='U')
        //     CREATE TABLE feedbacks (
        //         id VARCHAR(50) PRIMARY KEY,
        //         candidate_name NVARCHAR(255),
        //         mobile_number CHAR(10),
        //         designation NVARCHAR(100),
        //         department NVARCHAR(100),
        //         address NVARCHAR(MAX),
        //         submission_date NVARCHAR(20),
        //         q1_clarity INT,
        //         q2_communication INT,
        //         q3_expectations INT,
        //         q4_ambience INT,
        //         q5_alignment INT,
        //         q6_professionalism INT,
        //         q7_waiting_period INT,
        //         q8_opportunity INT,
        //         q9_transparency INT,
        //         q10_overall INT,
        //         referral BIT,
        //         qualitative NVARCHAR(MAX),
        //         created_at DATETIME DEFAULT GETDATE()
        //     )
        // `);
        console.log('✅ Connected to MSSQL Database');
    } catch (err) {
        console.warn('⚠️ Database connection failed. API routes will attempt connection per-request.', err.message);
    }
}

initDb();

// API Endpoints
app.get('/api/feedback', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM [SFA].[DBO].[hrfeedbacks] ORDER BY created_at DESC');
        
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
    const f = req.body;
    if (!f || !f.id) {
        return res.status(400).json({ error: 'Missing feedback data or ID' });
    }

    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('id', sql.VarChar(50), f.id)
            .input('candidate_name', sql.NVarChar(255), f.candidateName)
            .input('mobile_number', sql.Char(10), f.mobileNumber)
            .input('designation', sql.NVarChar(100), f.designation)
            .input('department', sql.NVarChar(100), f.department)
            .input('address', sql.NVarChar(sql.MAX), f.address)
            .input('submission_date', sql.NVarChar(20), f.date)
            .input('q1', sql.Int, f.ratings.q1_clarity)
            .input('q2', sql.Int, f.ratings.q2_communication)
            .input('q3', sql.Int, f.ratings.q3_expectations)
            .input('q4', sql.Int, f.ratings.q4_ambience)
            .input('q5', sql.Int, f.ratings.q5_alignment)
            .input('q6', sql.Int, f.ratings.q6_professionalism)
            .input('q7', sql.Int, f.ratings.q7_waiting_period)
            .input('q8', sql.Int, f.ratings.q8_opportunity)
            .input('q9', sql.Int, f.ratings.q9_transparency)
            .input('q10', sql.Int, f.ratings.q10_overall)
            .input('referral', sql.Bit, f.referral ? 1 : 0)
            .input('qualitative', sql.NVarChar(sql.MAX), f.qualitative)
            .query(`INSERT INTO [SFA].[DBO].[hrfeedbacks] (id, candidate_name, mobile_number, designation, department, address, submission_date, q1_clarity, q2_communication, q3_expectations, q4_ambience, q5_alignment, q6_professionalism, q7_waiting_period, q8_opportunity, q9_transparency, q10_overall, referral, qualitative) VALUES (@id, @candidate_name, @mobile_number, @designation, @department, @address, @submission_date, @q1, @q2, @q3, @q4, @q5, @q6, @q7, @q8, @q9, @q10, @referral, @qualitative)`);
        
        console.log(`✅ Feedback saved: ${f.id} for ${f.candidateName}`);
        res.status(201).json({ id: f.id });
    } catch (err) {
        console.error('API POST Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// API 404 Handler - Fixed using Regex to avoid path-to-regexp PathError
app.all(/^\/api\/?.*/, (req, res) => {
    res.status(404).json({ 
        error: "Not Found",
        message: `API endpoint ${req.method} ${req.url} does not exist.` 
    });
});

// 3. Serve Static Files
app.use(express.static(rootDir));

// 4. SPA Catch-all
// We use a Regex literal to avoid path-to-regexp parsing errors.
app.get(/^(?!\/api).*/, (req, res) => {
    const fileExt = path.extname(req.url);
    if (fileExt && fileExt !== '.html') {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Listen on 0.0.0.0 to allow network access via IP 10.0.10.211
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server is running: http://localhost:${PORT}`);
    console.log(`📡 Network URL: http://10.0.10.211:${PORT}`);
    console.log(`📂 Serving files from: ${rootDir}\n`);
});
