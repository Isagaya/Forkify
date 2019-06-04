import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';


/** 
 * 
 * SEARCH CONTROLLER 
 * 
 * 
 * */

/**Global state of the app
 *  Search object
 *  Current recipe obj
 *  Shopping list obj
 *  Liked recipes
 */
const state = {};

const controlSearch = async () => {
    // Взять запрос из view
    const query = searchView.getInput();

    if (query) {
        // новый объект поиска и добавляем в глобальное состояние
        state.search = new Search(query);

        // Подготовить UI результата
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try {
            // Найти рецепт
            await state.search.getResult();

            // Вывод результатов в UI
            clearLoader();
            searchView.renderResults(state.search.result);
        } catch (error) {
            console.log(error);
            alert('Что-то пошло не так...');
            clearLoader();
        }
    }
};

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
    // Если тыкать по чайлдам, всё равно выберет родителя в качестве event
    const btn = e.target.closest('.btn-inline'); 

    if (btn) {
        // считываем атрибут goto в кнопке
        const goToPage = parseInt(btn.dataset.goto, 10);
        
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});


/* 

RECIPE CONTROLLER

*/

const controlRecipe = async () => {
    // Берем айдишник 
    const id = window.location.hash.replace('#', '');

    if (id) {
        // Готовим измененный интерфейс
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        // Подсветка выбранного рецепта
        if (state.search) searchView.highlightSelected(id);

        // Создаём новый объект Recipe 
        state.recipe = new Recipe (id);

        try {
            // Получаем дату из объекта и парсим ингредиенты
            await state.recipe.getRecipe();
            state.recipe.parseIngredients();

            // Используем методы, чтобы внести данные по готовке и сервировке
            state.recipe.calcTime();
            state.recipe.calcServings();

            // Выводим данные в интерфейс
            clearLoader();
            recipeView.renderRecipe(
                state.recipe, 
                state.likes.isLiked(id)
            );
        } catch (error) {
            console.log(error);
            alert('Данные по рецепту не подгрузились');
        }

    }

};

['hashchange', 'load'].forEach(event => addEventListener(event, controlRecipe));

// LIST CONTROLLER
//
//

const controlList = () => {
    // создадим новый лист ингридиентов если его нет
    if (!state.list) state.list = new List();

    // добавляем каждый ингридиент в лист ингридиентов и в UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    });
};

// Навешиваем ивенты на кнопки удалить из листа, и апдейтим лист
elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    // настраиваем кнопку удаления
    if (e.target.matches('.shopping__delete, .shopping__delete *')) {
        // удаляем из объекта state
        state.list.deleteItem(id);

        // удаляем из UI
        listView.deleteItem(id);

    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value, 10);
        state.list.updateCount(id, val);
    }

});


// LIKES CONTROLLER
//
//

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const curID = state.recipe.id;

    
    if(!state.likes.isLiked(curID)) { // юзер ещё не лакнул текущий рецепт
        // Добавляем лайк в объект state в массив лайков
        const newLike = state.likes.addLike(
            curID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );


        // перекключаем кнопку лайка (актив/неактив)
        likesView.toggleLikeBtn(true);


        // добавляем лайк в UI
        likesView.renderLike(newLike);



    } else { // юзер лайкнул рецепт
        // удаляем лайк из объекта state, из массива лайков
        state.likes.deleteLike(curID);


        // перекключаем кнопку лайка (актив/неактив)
        likesView.toggleLikeBtn(false);


        // удаляем лайк из UI
        likesView.deleteLike(curID);

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes());
    

};


// Загружаем дату из локалсторейджа при загрузке страницы
window.addEventListener('load', () => {
    state.likes = new Likes();

    // Получаем дату лайков
    state.likes.readStorage();

    // Делаем кнопки лайка активными или неактивными
    likesView.toggleLikeMenu(state.likes.getNumLikes());

    // рендерим существующие лайки
    state.likes.likes.forEach(like => likesView.renderLike(like));
});



// Навешиваем ивенты на ещё не появившиеся кнопки
elements.recipe.addEventListener('click', e => {
    if (e.target.matches('.btn-decrease, .btn-decrease *')) {
        // если кнопка минус тыкнута
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
    } else if (e.target.matches('.btn-increase, .btn-increase *')) {
        // если кнопка плюс тыкнута
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);

    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        // добавляем ингредиенты в лист покупок
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});