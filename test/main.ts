import * as Jasmine from 'jasmine';

const jasmine = new Jasmine();
jasmine.loadConfig({
    spec_dir: '.',
    spec_files: [
        '**/*.[sS]pec.js'
    ]
});
jasmine.execute();
