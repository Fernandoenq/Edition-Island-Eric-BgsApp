const {prismaClient} = require('../database/prismaClient');

class funcs{

    constructor(){}

    async getAll() {
        return (prismaClient.samsung.findMany());
    }

    async getUnique(id) {
        return prismaClient.samsung.findUnique({ where: { ID_IMAGEM: id } });
    }

    async create(dados) {
        return prismaClient.samsung.create({data: dados});
    }

    async delete(id) {
        return prismaClient.samsung.delete({where: {id: id}});
    }

    async update(dados, id) {
        return prismaClient.samsung.update({where: {id: id}, data: dados});
    }
}

module.exports = {funcs};