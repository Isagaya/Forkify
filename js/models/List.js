import uniqid from 'uniqid';

export default class List {
    constructor() {
        this.items = [];
    }

    addItem (count, unit, ingredient) {
        const item = {
            id: uniqid(),
            count,
            unit,
            ingredient
        }

        this.items.push(item);
        return item;
    }

    deleteItem (id) {
        // ищем индекс, который удовлетворяет условию колбэка (true)
        const index = this.items.findIndex(el => el.id === id);

        // пример сплайса: [2,4,8] -> splice(1,1) -> вернёт 4, 
        // и изменит массив на [2,8]. splice(с какого элемента начать, сколько элементов взять)
        this.items.splice(index, 1); // удаляем этот индекс
    }

    updateCount (id, newCount) {
        this.items.find(el => el.id === id).count = newCount;
    }

};