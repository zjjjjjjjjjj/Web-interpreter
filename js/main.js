// TODO: improve the marker system

import { Scanner, all_keywords } from './scanner.js';
import { Parser } from './parser.js';

Vue.use(ELEMENT);
var app = new Vue({
    el: '#app',
    data: {
        dumpast: false,
        date: new Date(),
        editor: null,
        prefix: '$ ',
        file: null,
        file_content: null,
        ast: null,
        terminal: null,
        fit_addon: null,
        cmd: ''
    },
    mounted() {
        require.config({ paths: { 'vs': 'https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.23.0/min/vs' } });
        window.MonacoEnvironment = {
            getWorkerUrl: function (workerId, label) {
                return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                    self.MonacoEnvironment = {
                    baseUrl: 'https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.23.0/min'
                    };
                    importScripts('https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.23.0/min/vs/base/worker/workerMain.js');`
                )}`;
            }
        };
        // initialize monaco editor
        require(['vs/editor/editor.main'], () => {
            monaco.languages.register({id: 'pseudocode'});
            monaco.languages.setMonarchTokensProvider('pseudocode', {
                all_keywords,
                tokenizer: {
                    root: [
                        [/[a-zA-Z_]\w*/, {
                            cases: {
                                '@all_keywords': 'keyword',
                                '@default': 'variable',
                            }
                        }],
                        [/\/\/.*$/, 'comment'],
                        [/".*?"/, 'string'],
                        [/'.?'/, 'char'],
                        [/\d+/, 'number'],
                        [/[+\-*/()\[\]=<>:]/, 'operators'],
                    ]
                }
            });
            monaco.editor.defineTheme('pseudocode-theme', {
                base: 'vs',
                rules: [
                    { token: 'keyword', foreground: '#8e2aa0' },
                    { token: 'comment', foreground: '#a1a1a1', fontStyle: 'italic' },
                    { token: 'variable', foreground: '#393a42' },
                    { token: 'string', foreground: '#71a056' },
                    { token: 'char', foreground: '#71a056' },
                    { token: 'number', foreground: '#8b690d' },
                    { token: 'operators', foreground: '#5a76ef' },
                ],
                colors: {
                }
            });
            monaco.languages.registerCompletionItemProvider('pseudocode', {
                provideCompletionItems: (model, position) => {
                    const suggestions = [
                        ...all_keywords.map(keyword => {
                            return {
                                label: keyword,
                                kind: monaco.languages.CompletionItemKind.Keyword,
                                insertText: keyword,
                            };
                        }),
                    ];
                    return { suggestions: suggestions };
                }
            });
            // create the editor
            this.editor = monaco.editor.create(this.$refs.editor, {
                language: 'pseudocode',
                fontSize: '18px',
                theme: 'pseudocode-theme',
                automaticLayout: true
            });
        });

        this.terminal = new Terminal({
            rendererType: "dom",
            rows: 16,
            theme: {
                foreground: "white",
                background: "#696969"
            }
        });
        this.terminal.open(this.$refs.terminal);
        this.terminal.writeln('Welcome to the Pseudocode interpreter');
        this.terminal.write(this.prefix);

        this.terminal.onKey(e => {
            let code = e.domEvent.which;
            if (code === 13){
                this.terminal.writeln(e.key);
                this.execute_cmd();
                this.cmd = '';
            }
            else if (code === 8) {
                this.terminal.write('\b \b');
                this.cmd = this.cmd.substring(0, this.cmd.length - 1);
            }
            else {
                this.cmd = this.cmd + e.key;
                this.terminal.write(e.key);
            }
        });
    },
    methods: {
        run() {
            this.code = this.editor?.getValue();
            if (this.code) {
                let tokens = null;
                let scanner = new Scanner(this.code);
                try {
                    tokens = scanner.scan();
                } 
                catch (e) {
                    this.report(e.toString());
                    return;
                }
                console.log(tokens);
                // for (let ts of t) {
                //     this.terminal.writeln(ts['type'].toString() + ' ' + tss['value'].toString());
                // }
                // this.terminal.writeln('Tokenization completed');
                let ast = null;
                let parser = new Parser(tokens);
                try {
                    ast = parser.parse();
                }
                catch (e) {
                    this.report(e.toString());
                    return;
                }
                if (ast != null) {
                    // this.terminal.writeln('Parsing completed');
                    this.dumpast ? ast.dump('') : null;
                    let start = new Date().getTime();
                    try {
                        ast.evaluate();
                    } catch (e) {
                        this.report(e.toString());
                        return;
                    }
                    let end = new Date().getTime();
                    let time = end - start;
                    this.terminal.writeln('Execution completed in ' + time + 'ms');
                }
                // cannot write in execute_cmd() for unknown reason
                this.terminal.write(this.prefix);
            }
        },
        stop(){

        },
        // switch_dump() {
        //     this.dumpast = !this.dumpast;
        //     this.switch_type = this.dumpast ? 'el-icon-open' : 'el-icon-turn-off';
        //     this.switch_color = this.dumpast ? '#696969' : '#909399';
        // },
        execute_cmd() {
            if (this.cmd == 'help') {
                this.terminal.writeln('help: show help');
                this.terminal.writeln('run: run the code');
                this.terminal.writeln('clear/cls: clear the terminal');
                this.terminal.write(this.prefix);
            }
            else if (this.cmd == 'run') {
                this.run();
            }
            else if (this.cmd == 'clear' || this.cmd == 'cls') {
                this.terminal.clear();
                this.terminal.write(this.prefix);
            }
            else {
                this.terminal.writeln(this.cmd + ': Command not found');
                this.terminal.write(this.prefix);
            }
        },
        set_mark(e) {
            this.markers.push({
                startLineNumber: e.current_line,
                endLineNumber: e.current_line,
                startColumn: e.current_char,
                endColumn: e.current_char + 1,
                message: e.msg,
                severity: monaco.MarkerSeverity.Error
            });
            monaco.editor.setModelMarkers(this.editor.getModel(), 'pseudocode', this.markers);
        },
        report(err_msg) {
            this.terminal.writeln(err_msg);
            this.terminal.write(this.prefix);
        },
        handle_change(file) {
            this.file_content = file.raw;
            let file_name = file.name;
            let file_type = file_name.substring(file_name.lastIndexOf('.') + 1);
            if (this.file_content) {
                if (file_type === "pc") {
                    // weird problem...................
                    this.import_file(this.file_content);
                } 
                else {
                    this.$message({
                        type: "warning",
                        message: "incorrect file type"
                    });
                    console.log('error 1');
                }
            }
            else {
                console.log('error 2');
                this.$message({
                type: "warning",
                message: "please select a file"
                });
            }
        },
        import_file(obj) {
            let _this = this;
            let reader = new FileReader();
            reader.readAsText(obj);
            reader.onload = function() {
                _this.editor.setValue(reader.result);
            }
        }
    }
});

export {
    app
}
