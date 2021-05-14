
let outstruct = (errors, output) => ({
    errors : errors,
    output : output
})

let instruct = (lang, code, args, input) => ({
    lang : lang,
    code : code,
    args : args,
    input : input
})

let execute = function(program){
    console.log(`executing ${program.code.slice(0,10)}... via ${program.lang}`);

    const runner = exec(`sh runner.sh ${lang} ${code} ${args} ${input}`); 
    let output = outstruct("error_placeholder","output_placeholder");
    
    runner.stdout.on('data', (data)=>{
        output.output = data;
    });
    
    runner.stderr.on('data', (data)=>{
        output.error = data;
    });

    return output;
}

module.exports = {outstruct, instruct, execute};