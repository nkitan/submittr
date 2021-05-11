let outstruct = (errors, output) => ({
    errors : errors,
    output : output
})

let execute = function(lang, code){
    console.log(`executing ${code.slice(0,10)}... via ${lang}`);
    
    //TODO - RUN CODE HERE

    let output = outstruct("error_placeholder","output_placeholder");
    return output;
}

module.exports = {execute};