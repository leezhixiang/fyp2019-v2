let users = [];

module.exports = class User {
    constructor(socketId, userId, email, classIds = []) {
        this.socketId = socketId;
        this.userId = userId;
        this.email = email;
        this.classIds = classIds;
    };

    addUser() {
        users.push(this);
    };

    static removeUser(socketId) {
        users = users.filter((user) => {
            return user.socketId != socketId;
        });
    };

    static updateUser(newUser) {
        // replacing caring about position
        const indexOldUser = users.findIndex(user => user.socketId === newUser.socketId)
        users = [...users.slice(0, indexOldUser), newUser, ...users.slice(indexOldUser + 1)]
    };

    static getUsers() {
        return users;
    };
};