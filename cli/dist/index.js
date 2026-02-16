#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
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
let fileType = 'tf'; // default
if (ext === '.json') {
    if (filePath.endsWith('.tf.json')) {
        fileType = 'tf.json';
    }
    else {
        fileType = 'json';
    }
}
else if (ext === '.yaml' || ext === '.yml') {
    fileType = 'yaml';
}
console.log(`Analyzing ${filePath} (${fileType})...`);
axios_1.default.post(`${apiUrl}/ci/analyze`, {
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
        data.findings.forEach((f) => {
            console.log(`- [${f.severity.toUpperCase()}] ${f.control_id} on ${f.resource_id}: ${f.title || f.message}`);
        });
    }
    // Fail CI if critical/high findings
    if (data.summary.critical > 0 || data.summary.high > 0) {
        console.error('\nSecurity issues detected! Blocking deployment.');
        process.exit(1);
    }
    else {
        console.log('\nNo high-risk security issues detected.');
    }
})
    .catch(err => {
    console.error('Error:', err.response?.data || err.message);
    process.exit(1);
});
