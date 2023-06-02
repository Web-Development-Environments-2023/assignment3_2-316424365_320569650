const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id){
    await DButils.execQuery(`insert into FavoriteRecipes values (${user_id},${recipe_id})`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id from FavoriteRecipes where user_id=${user_id}`);
    return recipes_id;
}

async function getMyRecipes(user_id){
    const recipes_id = await DButils.execQuery(`SELECT recipe_id
        FROM usersRecipes WHERE user_id = ${user_id}`);
    return recipes_id;
}

async function getLastWatchedRecipes(user_id, number){
    const lastWatchedRecipes = await DButils.execQuery(`select recipe_id from lastwatched Where user_id=${user_id} Order By counter DESC Limit ${number}`)
    return lastWatchedRecipes;
}

async function getFamilyRecipes(user_id){
    let recipes = []
    const usersFamilyRecipes = await DButils.execQuery(`select * from usersfamilyrecipe where user_id=${user_id} LIMIT 3`);
    for(let familyRecipe of usersFamilyRecipes)
    {
        let ingredients = await getIngredientsFromRecipe(familyRecipe.ingredients);
        recipes.push({
            owner: familyRecipe.owner,
            name: familyRecipe.name,
            occassion: familyRecipe.occassion,
            ingredients:ingredients,
            preperation: familyRecipe.preperation,
            image: familyRecipe.image
        })
    }

    return recipes
}

async function getIngredientsFromRecipe(familyIngredients){
    let ingredients = []
    for(const ingredientKey in familyIngredients){
        ingredients.push({
            ingredientName: ingredientKey,
            quantity: familyIngredients[ingredientKey]
        })
    }
    return ingredients

}

async function addMyRecipe(user_id, recipePreview, recipeIngredients, recipePrepInstructions, numOfDishes){
    await DButils.execQuery(`INSERT INTO usersRecipes VALUES(${(user_id)}, '${(recipePreview.title)}', '${recipePreview.image}', '${recipePreview.readyInMinuts}', 0, ${recipePreview.vegetarian},
    ${recipePreview.vegan},'${(recipePreview.glutenFree)}','${(recipeIngredients)}', '${(recipePrepInstructions)}', ${numOfDishes})`);
}


exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getMyRecipes = getMyRecipes;
exports.addMyRecipe = addMyRecipe;
exports.getLastWatchedRecipes = getLastWatchedRecipes;
exports.getFamilyRecipes = getFamilyRecipes;
