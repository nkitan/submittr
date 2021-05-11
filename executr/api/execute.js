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
    
    //TODO - RUN CODE HERE

    let output = outstruct("error_placeholder","output_placeholder");
    return output;
}

module.exports = {instruct, execute};