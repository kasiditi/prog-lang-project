require.config({
    paths: {
        'vs': '../node_modules/monaco-editor/min/vs',
        'compiler': '../dist/compiler'
    }
});
require(['compiler', 'vs/editor/editor.main'], function(Compiler) {
    var editor = monaco.editor.create(document.getElementById('editor_container'), {
        value: [
            'DEFINE FUNCTION fibonacci WITH PARAM',
            '    n AS NUMBER',
            'THAT RETURN NUMBER',
            'DO',
            '    IF n LESS THAN OR EQUAL TO 0 DO',
            '        RETURN 0',
            '    BUT IF n EQUAL TO 1 DO',
            '        RETURN 1',
            '    OTHERWISE DO',
            '        DEFINE VARIABLE a TO BE MUTABLE NUMBER',
            '        DEFINE VARIABLE b TO BE MUTABLE NUMBER',
            '        CALL FUNCTION fibonacci WITH ARG n minus 1',
            '            THEN PUT RESULT INTO a',
            '        CALL FUNCTION fibonacci WITH ARG n minus 2',
            '            THEN PUT RESULT INTO b',
            '        RETURN a PLUS b',
            '    END OF IF',
            'END OF FUNCTION',
            '',
            'DEFINE FUNCTION listFibonacci WITH PARAM',
            '    start AS NUMBER ,',
            '    finish AS NUMBER',
            'DO',
            '    FOR i FROM start TO finish DO',
            '        DEFINE VARIABLE fiboRes TO BE MUTABLE NUMBER',
            '        CALL FUNCTION fibonacci WITH ARG i',
            '            THEN PUT RESULT INTO fiboRes',
            '        PRINT "Fibonacci of " PLUS i PLUS " is " PLUS fiboRes',
            '    END OF FOR',
            'END OF FUNCTION',
            '',
            'CALL FUNCTION listFibonacci WITH ARG 1 , 20',
        ].join('\n'),
        cursorBlinking: 'phase',
        renderIndentGuides: true
    });

    var astDisplay = monaco.editor.create(document.getElementById('ast_text_container'), {
        value: '',
        cursorBlinking: 'phase',
        readOnly: true,
        renderIndentGuides: true,
        language: 'json'
    });

    var jsDisplay = monaco.editor.create(document.getElementById('js_text_container'), {
        value: '',
        cursorBlinking: 'phase',
        readOnly: true,
        renderIndentGuides: true,
        language: 'javascript'
    });

    var outputDisplay = monaco.editor.create(document.getElementById('output_text_container'), {
        value:  'Click "Run Code" to run.\nThe output will show here and also on the browser console.\n',
        cursorBlinking: 'phase',
        readOnly: true,
        renderIndentGuides: true
    });

    if (editor && astDisplay && jsDisplay && outputDisplay) {
        var throttler = undefined;

        var alertContainer = document.getElementById('alert_container');

        var astContainer = document.getElementById('ast_container');
        var jsContainer = document.getElementById('js_container');
        var outputContainer = document.getElementById('output_container');

        var executeBtn = document.getElementById('execute_code_btn');

        var currentJsCode = '';

        var isOutputContainerFading = true;

        function setOutputContainerFade(isFade) {
            if (isOutputContainerFading === true) {
                if (isFade === false) {
                    astContainer.className = 'box out-box';
                    jsContainer.className = 'box out-box';
                    outputContainer.className = 'box out-box';
                }
            } else {
                if (isFade === true) {
                    astContainer.className = 'box out-box calculating';
                    jsContainer.className = 'box out-box calculating';
                    outputContainer.className = 'box out-box calculating';
                    executeBtn.disabled = true;
                }
            }
            isOutputContainerFading = isFade;
        }

        function compile() {
            throttler = undefined;
            var sourceCode = editor.getValue();
            try {
                var ast = Compiler.Parser.parseSourceCode(sourceCode);
                var astString = JSON.stringify(ast.instructions, null, 2);

                currentJsCode = (new Compiler.ECMAScriptCodeGenerator(ast)).generateCode();

                astDisplay.getModel().setValue(astString);
                jsDisplay.getModel().setValue(currentJsCode);

                alertContainer.style.display = 'none';
                executeBtn.disabled = false;
                setOutputContainerFade(false);
            } catch (ex) {
                alertContainer.innerText = ex;
                alertContainer.style.display = 'block';
                setOutputContainerFade(true);
                console.debug(ex);
            }
        }

        compile();

        executeBtn.onclick = function() {
            executeBtn.disabled = false;

            var output = [];
            var VM = {
                print: function(data) {
                    output.push(data);
                    console.log(data);
                }
            };

            try {
                eval(currentJsCode);
                var outputString = '';
                for (var i = 0; i < output.length; i++) {
                    outputString += output[i] + '\n';
                }
                outputDisplay.getModel().setValue(outputString);
            } catch (ex) {
                console.error(ex);
                outputDisplay.getModel().setValue('Error Running Code:\n' + (ex + ''));
            }
        };

        editor.onDidChangeModelContent(function(e) {
            setOutputContainerFade(true);

            if (throttler !== undefined) {
                clearTimeout(throttler);
            }
            throttler = setTimeout(compile, 500);
        });

        function invalidateEditorLayout() {
            editor.layout();
            astDisplay.layout();
            jsDisplay.layout();
            outputDisplay.layout();
        }

        window.onresize = function() {
            invalidateEditorLayout();
        };

        $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            invalidateEditorLayout();
        });
    }
});
