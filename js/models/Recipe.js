import axios from 'axios';
import { key } from '../config';

export default class Recipe {
    constructor(id) {
        this.id = id;
    }

    async getRecipe() {
    
        try {
            const res = await axios(`https://www.food2fork.com/api/get?key=${key}&rId=${this.id}`);
            this.title = res.data.recipe.title;
            this.author = res.data.recipe.publisher;
            this.img = res.data.recipe.image_url;
            this.url = res.data.recipe.source_url;
            this.ingredients = res.data.recipe.ingredients;
    
        } catch (err) {
            alert('Что-то пошло не так при получении data рецепта');
        }
    }

    calcTime() {
        // Расчет времени готовки (на 3 ингридиента около 15 минут)
        const numIng = this.ingredients.length;
        const periods = Math.ceil(numIng / 3);
        this.time = periods * 15;
    }

    calcServings() {
        // Расчет кол-ва порций
        this.servings = 4;
    }

    parseIngredients() {
        const unitsLong = ['tablespoons', 'tablespoon', 'ounces', 'ounce', 'teaspoons', 'teaspoon', 'cups', 'pounds'];
        const unitsShort = ['tbsp', 'tbsp', 'oz', 'oz', 'tsp', 'tsp', 'cup', 'pound'];
        const units = [...unitsShort, 'kg', 'g'];

        const newIngredients = this.ingredients.map(el => {
            // 1) Привести к единому сокращению слова
            let ingredient = el.toLowerCase();
            unitsLong.forEach((unit, i) => {
                ingredient = ingredient.replace(unit, unitsShort[i]);
            });

            // 2) Удалить скобки
            ingredient = ingredient.replace(/ *\([^)]*\) */g, ' ');

            // 3) Парсить ингридиенты
            const arrIng = ingredient.split(' ');

            // Ищем индекс элемента в массиве, проверяя элемент методом
            // includes, вернет true если он есть, а findIndex вернет его индекс
            // в массиве. Если же вдруг везде будет false, то findIndex вернет -1.
            const unitIndex = arrIng.findIndex(el2 => units.includes(el2));

            let objIng;

            if (unitIndex > -1) { // Если такой юнит существует

                // Например '4 1/2 cups', arrCount будет [4, 1/2]
                // Например '4 cups', arrCount будет [4]
                const arrCount = arrIng.slice(0, unitIndex);
                
                let count;

                if (arrCount.length === 1) {
                    count = eval(arrIng[0].replace('-', '+'));
                } else {
                    count = eval(arrIng.slice(0, unitIndex).join('+')); // '4+1/2', eval('4+1/2') ---> 4.5
                }

                objIng = {
                    count,
                    unit: arrIng[unitIndex],
                    ingredient: arrIng.slice(unitIndex + 1).join(' ')
                }
                
            } else if (unitIndex === -1) { // Если такого юнита нет
                objIng = {
                    count: 1,
                    unit: '',
                    ingredient
                }
            } else if (parseInt(arrIng[0], 10)) { // Если такого юнита нет, НО первый элемент число
                onjIng = {
                    count: parseInt(arrIng[0], 10),
                    unit: '',
                    ingredient: arrIng.slice(1).join(' ')
                }
            }



            return objIng;
        });
        this.ingredients = newIngredients;
    }

    updateServings(type) {
        // Апдейт сервировки
        const newServings = type === 'dec' ? this.servings - 1 : this.servings + 1;


        // апдейт ингридиентов
        this.ingredients.forEach(ing => {
            ing.count *= (newServings / this.servings);
        });

        this.servings = newServings;
    }
    
};