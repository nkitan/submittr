let hasher = function(password){
    const hashed = hash(password);
    return hashed;
}

let hash = function(password){
    // TODO - Perform Hashing
}

module.exports = {hasher};