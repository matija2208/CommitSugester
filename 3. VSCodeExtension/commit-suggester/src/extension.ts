import * as vscode from 'vscode';
import axios from 'axios';
import { execSync } from 'child_process';
import * as cp from 'child_process';

let llamaProcess: cp.ChildProcess | null = null;

async function isServerRunning(port: number): Promise<boolean> {
    try {
        await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
        return true;
    } catch {
        return false;
    }
}

async function startLlamaServer(): Promise<boolean> {
    const config = vscode.workspace.getConfiguration('commitSuggester');
    const serverPath = config.get<string>('llamaServerPath');
    const modelPath = config.get<string>('modelPath');
    const port = config.get<number>('port') ?? 8081;
    const gpuLayers = config.get<number>('gpuLayers') ?? 0;

    if (!serverPath || !modelPath) {
        vscode.window.showErrorMessage(
            'Commit Suggester: Podesi putanje u Settings (commitSuggester.llamaServerPath i commitSuggester.modelPath)'
        );
        return false;
    }

    if (await isServerRunning(port)) {
        return true;
    }

    return new Promise((resolve) => {
        vscode.window.showInformationMessage('Pokrećem llama-server...');

        llamaProcess = cp.spawn(serverPath, [
            '--model', modelPath,
            '--port', port.toString(),
            '--ctx-size', '4096',
            '--n-predict', '150',
            '--host', '127.0.0.1',
            '-ngl', gpuLayers.toString()
        ]);

        // Čekaj da server bude spreman
        let attempts = 0;
        const interval = setInterval(async () => {
            attempts++;
            if (await isServerRunning(port)) {
                clearInterval(interval);
                vscode.window.showInformationMessage('llama-server spreman! ✅');
                resolve(true);
            } else if (attempts > 30) { // 15 sekundi timeout
                clearInterval(interval);
                vscode.window.showErrorMessage('llama-server se nije pokrenuo na vreme.');
                resolve(false);
            }
        }, 500);

        llamaProcess.on('error', (err) => {
            clearInterval(interval);
            vscode.window.showErrorMessage(`Greška pri pokretanju llama-server: ${err.message}`);
            resolve(false);
        });
    });
}

function getStagedDiff(repoPath: string): string {
    try {
        const stat = execSync('git diff --staged --stat', {
            cwd: repoPath, encoding: 'utf-8', maxBuffer: 1024 * 1024
        }).trim();

        const patch = execSync('git diff --staged --patch', {
            cwd: repoPath, encoding: 'utf-8', maxBuffer: 1024 * 1024
        }).trim();

        // Stat uvek šalji ceo, patch skrati ako treba
        return `FILES CHANGED:\n${stat}\n\nDIFF:\n${patch.slice(0, 5000)}`;
    } catch {
        return '';
    }
}

function isInitialCommit(repoPath: string): boolean {
    try {
        execSync('git rev-parse HEAD', { cwd: repoPath, encoding: 'utf-8' });
        return false;
    } catch {
        return true;
    }
}

function getProjectName(repoPath: string): string {
    try {
        const remote = execSync('git remote get-url origin', {
            cwd: repoPath, encoding: 'utf-8'
        }).trim();
        return remote.split('/').pop()?.replace('.git', '') ?? '';
    } catch {
        // Nema remote-a, uzmi ime foldera
        return repoPath.split(/[\\/]/).pop() ?? '';
    }
}

async function suggestCommitMessage(diff: string, isInitial: boolean, projectName: string): Promise<string> {
    const prompt = (isInitial)? `You are an assistant that writes concise git commit messages.
This is the FIRST commit in a new repository. The project is named "${projectName}".
Write a single commit message that describes the entire project, not individual files.
A good initial commit message is something like "Initial commit: <brief project description>".
Use imperative mood. Return ONLY the commit message, nothing else.

FILES CHANGED:
${diff.slice(0, 1500)}`:`Napisi konciznu git commit poruku baziranu na datom git diff-u. 
${diff.slice(0, 6000)}`;

    const config = vscode.workspace.getConfiguration('commitSuggester');

    const LLAMA_URL = `http://localhost:${config.get<number>('port') ?? 8081}/v1/chat/completions`;
    
    const response = await axios.post(LLAMA_URL, {
        model: 'local',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3,
        stream: false
    });

    return response.data.choices[0].message.content.trim();
}

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('commit-suggester.suggest', async () => {
        const ready = await startLlamaServer();
        if (!ready) return;
        
        // Pronađi git repo
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Nema otvorenog workspace-a.');
            return;
        }
        const repoPath = workspaceFolders[0].uri.fsPath;

        // Uzmi staged diff
        const diff = getStagedDiff(repoPath);
        if (!diff) {
            vscode.window.showWarningMessage('Nema staged promena. Uradi git add prvo.');
            return;
        }

        // Pozovi model
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generišem commit poruku...',
            cancellable: false
        }, async () => {
            try {
                const suggestion = await suggestCommitMessage(diff, isInitialCommit(repoPath), getProjectName(repoPath));

                // Prikaži predlog sa opcijama
                const action = await vscode.window.showInformationMessage(
                    `💡 Predlog: "${suggestion}"`,
                    'Kopiraj',
                    'Upiši u SCM',
                    'Odbaci'
                );

                if (action === 'Kopiraj') {
                    await vscode.env.clipboard.writeText(suggestion);
                    vscode.window.showInformationMessage('Kopirano u clipboard!');
                } else if (action === 'Upiši u SCM') {
                    // Upiše direktno u VS Code Source Control input box
                    const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
                    const git = gitExtension?.getAPI(1);
                    if (git?.repositories?.length > 0) {
                        git.repositories[0].inputBox.value = suggestion;
                    }
                }
            } catch (err) {
                vscode.window.showErrorMessage('Greška: ne mogu da dostignem llama-server. Pokusavam pokretanje lokalnog servera...');
                try {
                    const started = await startLlamaServer();
                    if (!started) {
                        vscode.window.showErrorMessage('Ne mogu pokrenuti llama-server. Proveri konfiguraciju i ponovo pokreni komandu.');
                        return;
                    }
                    vscode.window.showInformationMessage('Llama server pokrenut! Pokušaj ponovo.');
                } catch {
                    vscode.window.showErrorMessage('Ne mogu pokrenuti llama-server. Proveri da li je Node.js instaliran i da li je npx dostupan.');
                }
            }
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate()
{
    if (llamaProcess) {
        llamaProcess.kill();
        llamaProcess = null;
    }
}