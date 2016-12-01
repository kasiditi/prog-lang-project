require.config({
    paths: {
        'vs': '../node_modules/monaco-editor/min/vs',
        'compiler': '../dist/compiler.min'
    }
});
require(['compiler', 'vs/editor/editor.main'], function (Compiler) {
    var editor = monaco.editor.create(document.getElementById('editor_container'), {
        value: [
            'Define variable sum to be mutable number initialized to 0',
            '',
            'Define variable min to be equal to 1',
            'Define variable max to be equal to 10',
            '',
            'For i from min to max do',
            '    Increase sum by i plus 1',
            '    Print i',
            'End of for',
            '',
            'Print "Sum" Plus i',
            ''
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
