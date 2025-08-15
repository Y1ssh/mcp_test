import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SetupVerifier {
    constructor() {
        this.checks = [];
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${type}]`;
        
        switch (type) {
            case 'ERROR':
                console.error(`${prefix} ❌ ${message}`);
                break;
            case 'WARN':
                console.warn(`${prefix} ⚠️  ${message}`);
                break;
            case 'SUCCESS':
                console.log(`${prefix} ✅ ${message}`);
                break;
            default:
                console.log(`${prefix} ℹ️  ${message}`);
        }
    }

    async checkNodeVersion() {
        return new Promise((resolve) => {
            const nodeProcess = spawn('node', ['--version'], { stdio: 'pipe' });
            let version = '';
            
            nodeProcess.stdout.on('data', (data) => {
                version += data.toString();
            });
            
            nodeProcess.on('close', (code) => {
                if (code === 0) {
                    const versionNumber = version.trim().replace('v', '');
                    const majorVersion = parseInt(versionNumber.split('.')[0]);
                    
                    if (majorVersion >= 18) {
                        this.log(`Node.js version ${version.trim()} (✓ Compatible)`, 'SUCCESS');
                        this.checks.push({ name: 'Node.js Version', status: 'PASS', details: version.trim() });
                    } else {
                        this.log(`Node.js version ${version.trim()} (✗ Requires v18+)`, 'ERROR');
                        this.errors.push('Node.js version must be 18 or higher');
                        this.checks.push({ name: 'Node.js Version', status: 'FAIL', details: version.trim() });
                    }
                } else {
                    this.log('Node.js not found or not accessible', 'ERROR');
                    this.errors.push('Node.js is not installed or not in PATH');
                    this.checks.push({ name: 'Node.js Version', status: 'FAIL', details: 'Not found' });
                }
                resolve();
            });
        });
    }

    checkDependencies() {
        this.log('Checking dependencies...');
        
        try {
            const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
            const packageLockExists = fs.existsSync('./package-lock.json');
            const nodeModulesExists = fs.existsSync('./node_modules');
            
            if (packageLockExists && nodeModulesExists) {
                this.log('Dependencies properly installed', 'SUCCESS');
                this.checks.push({ name: 'Dependencies', status: 'PASS', details: 'package-lock.json and node_modules exist' });
            } else {
                this.log('Dependencies may not be installed. Run "npm install"', 'WARN');
                this.warnings.push('Run "npm install" to ensure all dependencies are installed');
                this.checks.push({ name: 'Dependencies', status: 'WARN', details: 'Missing package-lock.json or node_modules' });
            }
            
            // Check for required dependencies
            const requiredDeps = ['ws'];
            const requiredDevDeps = ['@types/vscode', 'typescript'];
            const missingDeps = [];
            
            requiredDeps.forEach(dep => {
                if (!packageJson.dependencies?.[dep]) {
                    missingDeps.push(dep);
                }
            });
            
            requiredDevDeps.forEach(dep => {
                if (!packageJson.devDependencies?.[dep]) {
                    missingDeps.push(`${dep} (dev)`);
                }
            });
            
            if (missingDeps.length > 0) {
                this.log(`Missing required dependencies: ${missingDeps.join(', ')}`, 'ERROR');
                this.errors.push(`Missing dependencies: ${missingDeps.join(', ')}`);
            }
            
        } catch (error) {
            this.log(`Error checking dependencies: ${error.message}`, 'ERROR');
            this.errors.push('Could not read package.json');
            this.checks.push({ name: 'Dependencies', status: 'FAIL', details: error.message });
        }
    }

    checkBuildArtifacts() {
        this.log('Checking build artifacts...');
        
        const requiredFiles = [
            './dist/server.js',
            './dist/cursor-controller.js',
            './dist/types.js'
        ];
        
        const missingFiles = [];
        
        requiredFiles.forEach(file => {
            if (!fs.existsSync(file)) {
                missingFiles.push(file);
            }
        });
        
        if (missingFiles.length === 0) {
            this.log('All build artifacts present', 'SUCCESS');
            this.checks.push({ name: 'Build Artifacts', status: 'PASS', details: 'All required files exist' });
        } else {
            this.log(`Missing build artifacts: ${missingFiles.join(', ')}`, 'ERROR');
            this.log('Run "npm run build" to generate missing files', 'INFO');
            this.errors.push('Missing build artifacts. Run "npm run build"');
            this.checks.push({ name: 'Build Artifacts', status: 'FAIL', details: `Missing: ${missingFiles.join(', ')}` });
        }
    }

    async checkPortAvailability() {
        this.log('Checking port availability...');
        
        const ports = [3056, 3057];
        const portChecks = await Promise.all(ports.map(port => this.isPortAvailable(port)));
        
        ports.forEach((port, index) => {
            if (portChecks[index]) {
                this.log(`Port ${port} is available`, 'SUCCESS');
                this.checks.push({ name: `Port ${port}`, status: 'PASS', details: 'Available' });
            } else {
                this.log(`Port ${port} is in use`, 'WARN');
                this.warnings.push(`Port ${port} is already in use`);
                this.checks.push({ name: `Port ${port}`, status: 'WARN', details: 'In use' });
            }
        });
    }

    isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    server.once('close', () => {
                        resolve(true);
                    });
                    server.close();
                }
            });
            
            server.on('error', () => {
                resolve(false);
            });
        });
    }

    async checkTypeScriptCompilation() {
        this.log('Checking TypeScript compilation...');
        
        return new Promise((resolve) => {
            const tscProcess = spawn('npm', ['run', 'build-server'], { stdio: 'pipe', shell: true });
            let output = '';
            let errorOutput = '';
            
            tscProcess.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            tscProcess.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            tscProcess.on('close', (code) => {
                if (code === 0) {
                    this.log('TypeScript compilation check passed', 'SUCCESS');
                    this.checks.push({ name: 'TypeScript Compilation', status: 'PASS', details: 'No compilation errors' });
                } else {
                    this.log('TypeScript compilation has errors', 'ERROR');
                    this.log(`Compilation output: ${errorOutput}`, 'ERROR');
                    this.errors.push('TypeScript compilation errors found');
                    this.checks.push({ name: 'TypeScript Compilation', status: 'FAIL', details: errorOutput.substring(0, 200) });
                }
                resolve();
            });
            
            tscProcess.on('error', (error) => {
                this.log(`TypeScript compilation check skipped: ${error.message}`, 'WARN');
                this.warnings.push('Could not run TypeScript compilation check');
                this.checks.push({ name: 'TypeScript Compilation', status: 'WARN', details: 'Could not run check' });
                resolve();
            });
        });
    }

    checkFilePermissions() {
        this.log('Checking file permissions...');
        
        const criticalPaths = [
            './package.json',
            './src/',
            './dist/',
            './'
        ];
        
        let permissionIssues = [];
        
        criticalPaths.forEach(filePath => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.accessSync(filePath, fs.constants.R_OK | fs.constants.W_OK);
                }
            } catch (error) {
                permissionIssues.push(filePath);
            }
        });
        
        if (permissionIssues.length === 0) {
            this.log('File permissions are correct', 'SUCCESS');
            this.checks.push({ name: 'File Permissions', status: 'PASS', details: 'All paths accessible' });
        } else {
            this.log(`Permission issues with: ${permissionIssues.join(', ')}`, 'ERROR');
            this.errors.push(`File permission issues: ${permissionIssues.join(', ')}`);
            this.checks.push({ name: 'File Permissions', status: 'FAIL', details: `Issues: ${permissionIssues.join(', ')}` });
        }
    }

    checkConfigurationFiles() {
        this.log('Checking configuration files...');
        
        const configFiles = [
            { path: './tsconfig.json', name: 'TypeScript Config' },
            { path: './tsconfig.extension.json', name: 'Extension TypeScript Config' },
            { path: './claude-desktop-config.json', name: 'Claude Desktop Config' }
        ];
        
        configFiles.forEach(({ path, name }) => {
            if (fs.existsSync(path)) {
                try {
                    if (path.endsWith('.json')) {
                        JSON.parse(fs.readFileSync(path, 'utf8'));
                    }
                    this.log(`${name} is valid`, 'SUCCESS');
                    this.checks.push({ name, status: 'PASS', details: 'File exists and valid' });
                } catch (error) {
                    this.log(`${name} has syntax errors: ${error.message}`, 'ERROR');
                    this.errors.push(`Invalid ${name}: ${error.message}`);
                    this.checks.push({ name, status: 'FAIL', details: error.message });
                }
            } else {
                this.log(`${name} not found`, 'WARN');
                this.warnings.push(`${name} not found`);
                this.checks.push({ name, status: 'WARN', details: 'File not found' });
            }
        });
    }

    checkWorkspaceStructure() {
        this.log('Checking workspace structure...');
        
        const expectedStructure = [
            { path: './src', type: 'directory', critical: true },
            { path: './src/server.ts', type: 'file', critical: true },
            { path: './src/extension.ts', type: 'file', critical: true },
            { path: './src/cursor-controller.ts', type: 'file', critical: true },
            { path: './src/mcp-client.ts', type: 'file', critical: true },
            { path: './package.json', type: 'file', critical: true },
            { path: './dist', type: 'directory', critical: false }
        ];
        
        let structureIssues = [];
        
        expectedStructure.forEach(({ path, type, critical }) => {
            const exists = fs.existsSync(path);
            
            if (!exists && critical) {
                structureIssues.push(`Missing critical ${type}: ${path}`);
            }
            
            if (exists) {
                const stats = fs.statSync(path);
                const isCorrectType = (type === 'directory' && stats.isDirectory()) || 
                                    (type === 'file' && stats.isFile());
                
                if (!isCorrectType) {
                    structureIssues.push(`Incorrect type for ${path}: expected ${type}`);
                }
            }
        });
        
        if (structureIssues.length === 0) {
            this.log('Workspace structure is correct', 'SUCCESS');
            this.checks.push({ name: 'Workspace Structure', status: 'PASS', details: 'All expected files and directories present' });
        } else {
            this.log(`Workspace structure issues: ${structureIssues.join(', ')}`, 'ERROR');
            this.errors.push(`Workspace structure issues found`);
            this.checks.push({ name: 'Workspace Structure', status: 'FAIL', details: structureIssues.join(', ') });
        }
    }

    generateReport() {
        this.log('\n=== SETUP VERIFICATION REPORT ===');
        
        const passedChecks = this.checks.filter(check => check.status === 'PASS');
        const failedChecks = this.checks.filter(check => check.status === 'FAIL');
        const warningChecks = this.checks.filter(check => check.status === 'WARN');
        
        this.log(`Total Checks: ${this.checks.length}`);
        this.log(`Passed: ${passedChecks.length}`);
        this.log(`Failed: ${failedChecks.length}`);
        this.log(`Warnings: ${warningChecks.length}`);
        
        if (failedChecks.length > 0) {
            this.log('\n❌ FAILED CHECKS:');
            failedChecks.forEach(check => {
                this.log(`  • ${check.name}: ${check.details}`, 'ERROR');
            });
        }
        
        if (warningChecks.length > 0) {
            this.log('\n⚠️  WARNING CHECKS:');
            warningChecks.forEach(check => {
                this.log(`  • ${check.name}: ${check.details}`, 'WARN');
            });
        }
        
        if (passedChecks.length > 0) {
            this.log('\n✅ PASSED CHECKS:');
            passedChecks.forEach(check => {
                this.log(`  • ${check.name}`, 'SUCCESS');
            });
        }
        
        // Summary and recommendations
        this.log('\n=== RECOMMENDATIONS ===');
        
        if (this.errors.length > 0) {
            this.log('🔴 CRITICAL ISSUES TO FIX:');
            this.errors.forEach(error => {
                this.log(`  • ${error}`, 'ERROR');
            });
        }
        
        if (this.warnings.length > 0) {
            this.log('\n🟡 WARNINGS TO CONSIDER:');
            this.warnings.forEach(warning => {
                this.log(`  • ${warning}`, 'WARN');
            });
        }
        
        if (this.errors.length === 0 && this.warnings.length === 0) {
            this.log('\n🎉 SETUP VERIFICATION COMPLETE - NO ISSUES FOUND!', 'SUCCESS');
            this.log('Your MCP Bridge setup is ready to use.', 'SUCCESS');
        } else if (this.errors.length === 0) {
            this.log('\n🟢 SETUP VERIFICATION COMPLETE - MINOR WARNINGS ONLY', 'SUCCESS');
            this.log('Your MCP Bridge setup should work, but consider addressing warnings.', 'SUCCESS');
        } else {
            this.log('\n🔴 SETUP VERIFICATION FAILED', 'ERROR');
            this.log('Please fix the critical issues before proceeding.', 'ERROR');
        }
        
        const success = this.errors.length === 0;
        return success;
    }

    async runAllChecks() {
        this.log('Starting setup verification...\n');
        
        await this.checkNodeVersion();
        this.checkDependencies();
        this.checkBuildArtifacts();
        await this.checkPortAvailability();
        await this.checkTypeScriptCompilation();
        this.checkFilePermissions();
        this.checkConfigurationFiles();
        this.checkWorkspaceStructure();
        
        return this.generateReport();
    }
}

// Run verification if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('verify-setup.js')) {
    const verifier = new SetupVerifier();
    
    verifier.runAllChecks()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Verification runner error:', error);
            process.exit(1);
        });
}

export default SetupVerifier; 