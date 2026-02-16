#!/usr/bin/env node
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const apiKey = process.env.STORAGEGUARD_API_KEY;
const apiUrl = process.env.STORAGEGUARD_URL || 'http://localhost:3000/api'; // Changed to match local dev default

const filePath = process.argv[2];
if (!filePath) {
    console.error('Usage: storageguard-ci <file>');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf-8');
const ext = path.extname(filePath).toLowerCase();
let fileType: string = 'tf'; // default

if (ext === '.json') {
    if (filePath.endsWith('.tf.json')) {
        fileType = 'tf.json';
    } else {
        fileType = 'json';
    }
} else if (ext === '.yaml' || ext === '.yml') {
    fileType = 'yaml';
}

console.log(`Analyzing ${filePath} (${fileType})...`);

axios.post(`${apiUrl}/ci/analyze`, {
    content,
    fileType,
    provider: process.env.CLOUD_PROVIDER || 'aws',
}, {
    headers: { Authorization: `Bearer ${apiKey}` }
})
    .then(response => {
        const data = response.data;
        console.log('Analysis Results:');
        console.log(JSON.stringify(data.summary, null, 2));

        if (data.findings && data.findings.length > 0) {
            console.log('\nFindings:');
            data.findings.forEach((f: any) => {
                console.log(`- [${f.severity.toUpperCase()}] ${f.control_id} on ${f.resource_id}: ${f.title || f.message}`);
            });
        }

        // Fail CI if critical/high findings
        if (data.summary.critical > 0 || data.summary.high > 0) {
            console.error('\nSecurity issues detected! Blocking deployment.');
            process.exit(1);
        } else {
            console.log('\nNo high-risk security issues detected.');
        }
    })
    .catch(err => {
        console.error('Error:', err.response?.data || err.message);
        process.exit(1);
    });
