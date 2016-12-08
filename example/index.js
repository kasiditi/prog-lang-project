require.config({
    paths: {
        'vs': '../node_modules/monaco-editor/min/vs',
        'compiler': '../dist/compiler'
    }
});
require(['compiler', 'vs/editor/editor.main'], function (Compiler) {
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

    if (editor && astDisplay) {
        var throttler = undefined;

        var alertContainer = document.getElementById('alert_container');
        var astContainer = document.getElementById('ast_container');

        var isAstContainerFading = true;

        function setAstContainerFade(isFade) {
            if (isAstContainerFading === true) {
                if (isFade === false) {
                    astContainer.className = 'box ast-box';
                }
            } else {
                if (isFade === true) {
                    astContainer.className = 'box ast-box calculating';
                }
            }
            isAstContainerFading = isFade;
        }

        function compile() {
            throttler = undefined;
            var sourceCode = editor.getValue();
            try {
                var astResult = Compiler.Parser.parseSourceCode(sourceCode);
                var result = JSON.stringify(astResult.instructions, null, 2);
                astDisplay.getModel().setValue(result);
                alertContainer.style.display = 'none';
                setAstContainerFade(false);
            } catch (ex) {
                alertContainer.innerText = ex;
                alertContainer.style.display = 'block';
                setAstContainerFade(true);
                console.debug(ex);
            }
        }

        compile();

        editor.onDidChangeModelContent(function (e) {
            setAstContainerFade(true);

            if (throttler !== undefined) {
                clearTimeout(throttler);
            }
            throttler = setTimeout(compile, 500);
        });
        window.onresize = function () {
            editor.layout();
            astDisplay.layout();
        };
    }
});
