const {funcs} = require('./funcs');

const fun = new funcs();

function a(){
    fun.getAll().then((data) => {
        console.log(data);
    })
}

a();