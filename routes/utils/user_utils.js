const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values ('${user_id}',${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id='${user_id}'`);
    return recipes_id;
}

async function getMyRecipes(user_id){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id
        FROM usersRecipes WHERE user_id = ${user_id}`);
    return recipes_id;
}

async function addMyRecipe(user_id, recipePreview, recipeIngredients, recipePrepInstructions, numOfDishes){
    await DButils.execQuery(`INSERT INTO usersRecipes VALUES(${(user_id)}, '${(recipePreview.title)}', '${recipePreview.image}', '${recipePreview.readyInMinuts}', 0, ${recipePreview.vegetarian},
    ${recipePreview.vegan},'${(recipePreview.glutenFree)}','${(recipeIngredients)}', '${(recipePrepInstructions)}', ${numOfDishes})`);
}

exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.addMyRecipe = addMyRecipe;