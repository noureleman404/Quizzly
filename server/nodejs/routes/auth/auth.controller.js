const jwt = require('jsonwebtoken');
const md5 = require('md5');
const { pool } = require('../../databaseConf');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET ;

// LOGIN
const login = async (req, res) => {
    const { email, password, type: userType } = req.body;
    const connection = await pool.connect();

    try {
        console.log(req.body);
        let table;
        if (userType === 'admin') {
            table = 'admins';
        } else if (userType === 'teacher') {
            table = 'teachers';
        } else if (userType === 'student') {
            table = 'students';
        } else {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        const result = await connection.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const hashedPassword = md5(password);

        if (user.password_hash !== hashedPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: userType,
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                type: userType,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// SIGNUP
const signup = async (req, res) => {
    const { name, email, password, type: userType } = req.body;
    const connection = await pool.connect();

    try {
        let table;
        if (userType === 'admin') {
            table = 'admins';
        } else if (userType === 'teacher') {
            table = 'teachers';
        } else if (userType === 'student') {
            table = 'students';
        } else {
            return res.status(400).json({ error: 'Invalid user type' });
        }

        const existing = await connection.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        const hashedPassword = md5(password);
        const result = await connection.query(
            `INSERT INTO ${table} (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email`,
            [name, email, hashedPassword]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                type: userType,
            },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        return res.status(201).json({
            message: 'Signup successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                type: userType,
            },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        connection.release();
    }
};

// GET CURRENT USER
const getCurrentUser = async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { id, type: userType } = decoded;

        let table;
        if (userType === 'admin') table = 'admins';
        else if (userType === 'teacher') table = 'teachers';
        else if (userType === 'student') table = 'students';
        else return res.status(400).json({ error: 'Invalid user type' });

        const connection = await pool.connect();
        const result = await connection.query(`SELECT id, name, email FROM ${table} WHERE id = $1`, [id]);
        connection.release();

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({ user: result.rows[0], type: userType });
    } catch (error) {
        console.error('Token error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = {
    login,
    signup,
    getCurrentUser,
};