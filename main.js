import { Scanner } from './scanner.js';
import { Parser } from './parser.js';
import { Error } from './error.js';

Vue.use(ELEMENT);
var app = new Vue({
    el: '#app',
    data: {
        dumpast: false,
        current_line: 1,
        current_char: 1,
        output: '',
        editor: null,
        prefix: '$ ',
        terminal: null,
        cmd: ''
    },
    mounted() {
        require.config({paths: {'vs': 'https://cdn.bootcdn.net/ajax/libs/monaco-editor/0.23.0/min/vs'}});
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
        require(['vs/editor/editor.main'], () => {
            this.editor = monaco.editor.create(this.$refs.editor, {
                language: "c",
                automaticLayout: true
            });
        });

        this.terminal = new Terminal({
            rendererType: "dom",
            rows: 20,
            theme: {
                foreground: "white",
                background: "#919399"
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
                    ast.evaluate();
                }
                this.terminal.write(this.prefix);
            }
        },
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
        report(err_msg) {
            this.terminal.writeln(err_msg);
            this.terminal.write(this.prefix);
        }
    }
});

export {
    app
}
