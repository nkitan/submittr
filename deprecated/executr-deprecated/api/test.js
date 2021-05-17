let outstruct = (errors, output) => ({
    errors : errors,
    output : output
})

output = outstruct("ehhlo","helklo");
pot = outstruct("mehlo","kehlo");
pot.output = "SEHLO!";
console.log(pot);