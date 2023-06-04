const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");



/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview   
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeInformationFromDB(recipe_id) {
    let recipe_data = await DButils.execQuery(`SELECT * FROM usersRecipes WHERE recipe_id = ${recipe_id}`);
    return {
        id: recipe_data[0].recipe_id,
        title: recipe_data[0].title,
        readyInMinutes: recipe_data[0].readyInMinutes,
        image: recipe_data[0].image,
        vegan: recipe_data[0].vegan,   
        vegetarian: recipe_data[0].vegetarian,
        glutenFree: recipe_data[0].glutenFree
    };
}


async function getRecipeDetails(recipe_id, user_id) {

    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    const isWatched = await checkDBForRecord(user_id, recipe_id, 'LastWatched')

    const isSaved = await checkDBForRecord(user_id, recipe_id, 'FavoriteRecipes')
    return {
        recipePreview:{ 
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            wasWatched: isWatched,
            savedToFavourites: isSaved}
    }

}


async function getMyRecipeDetails(recipe_id, user_id) {
    let recipe_info = await getRecipeInformationFromDB(recipe_id);
    let {id, title, readyInMinutes, image, vegan, vegetarian, glutenFree} = recipe_info;
    return {
        recipePreview:{ 
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree
        }
    }
}

// async function getRecipeFullDetailsFromDB(recipe_id, session){

// }


async function getRecipeFullDetails(recipe_id, session){
    let user_id;
    let recipe_info = await getRecipeInformation(recipe_id);
    let { 
        id, title, readyInMinutes, image, aggregateLikes, vegan,
         vegetarian, glutenFree, servings, instructions, extendedIngredients } = recipe_info.data;
    // if the logged user tries to access the page
    if(session && session.user_id)
    {
        user_id = session.user_id
        // insert recipe to watchedlist
        await addToDB(user_id, recipe_id, 'LastWatched')
    }
    const isWatched = await checkDBForRecord(user_id, recipe_id, 'LastWatched');
    const isSaved = await checkDBForRecord(user_id, recipe_id, 'FavoriteRecipes');
    //get from the extended ingredients the name, amount and unit
    const listOfIngredients = await getNameAndQuantityIngredients(extendedIngredients);

    return {
        recipePreview:{ 
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,
            wasWatched: isWatched,
            savedToFavourites: isSaved},
        ingredients: listOfIngredients,    
        instructions: instructions,
        servings: servings
    }
}

async function getNameAndQuantityIngredients(extendedIngredients){
    let listOfIngredients = []

    for(ingredient of extendedIngredients){
        listOfIngredients.push({
            ingredientName: ingredient.name,
            quantity: ingredient.amount.toString()+" "+ ingredient.unit

        })
    }
    return listOfIngredients;
}

async function getRecipesPreview(recipes_id_array, user_id){
    let res = [];
    let recipesPreview = [];
    for(recipe_id of recipes_id_array){
        recipesPreview.push(getRecipeDetails(recipe_id, user_id))
    }
    await Promise.all(recipesPreview)
        .then((results)=>{
            res = results.map((rec)=>rec.recipePreview);
        });
    return res;
}

async function getMyRecipesPreview(recipes_id_array, user_id){
    let res = [];
    let myRecipesPreview = [];
    for(recipe_id of recipes_id_array){
        myRecipesPreview.push(getMyRecipeDetails(recipe_id, user_id))
    }
    await Promise.all(myRecipesPreview)
        .then((results)=>{
            res = results.map((rec)=>rec.recipePreview);
        });
    return res;
}



async function getThreeRandomRecipes(session, num){
    //gets 3 random recipes
    const recipesDetailsFromSpoonacular = await axios.get(`${api_domain}/random`, {
        params: {
            number: num,
            apiKey: process.env.spooncular_apiKey
        }
    });

    const recipesFixedDetails = await cutIrrelevantDetailsFromRecipes(session, recipesDetailsFromSpoonacular.data.recipes)
    return recipesFixedDetails;

}

async function cutIrrelevantDetailsFromRecipes(session, recipesFromSpoonacular){
    // get relevant details 
    let fixedRecipeDetails = [];

    let user_id;
    if (session && session.user_id)
    {
        user_id = session.user_id;
    }
    for (const element of recipesFromSpoonacular)
    {
        let isSaved = await checkDBForRecord(user_id, element.id, 'FavoriteRecipes')
        let isWatched = await checkDBForRecord(user_id, element.id, 'LastWatched')
        fixedRecipeDetails.push({
            id: element.id,
            title: element.title,
            readyInMinutes: element.readyInMinutes,
            image: element.image,
            popularity: element.aggregateLikes,
            vegan: element.vegan,
            vegetarian: element.vegetarian,
            glutenFree: element.glutenFree,
            wasWatched: isWatched,
            savedToFavourites: isSaved
        })
    }

    return fixedRecipeDetails;
}

async function checkDBForRecord(user_id, recipe_id, table)
{
    if(user_id == undefined)
    {
        return false;
    }
        return (await DButils.execQuery(`select * from ${table} where user_id=${user_id} and recipe_id=${recipe_id}`)).length>0;

}

async function addToDB(user_id, recipe_id, table){
    await DButils.execQuery(`insert into ${table}(user_id, recipe_id) values (${user_id},${recipe_id})`);
}

async function searchForRecipes(recipeName, cuisine, diet, intolerance, amount, session)
{
    let user_id;
    if(session){
        user_id = session.user_id
        console.log(`This Session is user: ${user_id}`)
    }
    console.log(session.saved_search)
    if(session.saved_search && recipeName === undefined && cuisine === undefined && diet === undefined 
        && intolerance === undefined && amount === undefined)
        {
        recipeName = session.saved_search.recipeName
        cuisine = session.saved_search.cuisine
        diet = session.saved_search.diet
        intolerance = session.saved_search.intolerance
        amount = session.saved_search.amount
    }
    //join the arrays to string seperated by comma:
    if(Array.isArray(cuisine)){
        cuisine = cuisine.join(',')
    }
    if(Array.isArray(diet)){
        diet = diet.join(',')

    }
    if(Array.isArray(intolerance)){
        intolerance = intolerance.join(',') 

    }
    // get the recipes from api
    const filteredRecipes =  await axios.get(`${api_domain}/complexSearch`, {
        params: {
            query: recipeName,
            cuisine: cuisine,
            intolerances: intolerance,
            diet: diet,
            number: amount,
            instructionsRequired: true,
            addRecipeInformation:true,
            apiKey: process.env.spooncular_apiKey
        }})
    // get from the recipes the InstructionPreviewRecipe
    const filteredRecipesReformated = await formatRecipesToPreviewRecipe(filteredRecipes.data.results, user_id)
    return filteredRecipesReformated;
}

async function formatRecipesToPreviewRecipe(recipesFromSpoonacular, user_id){
    let PreviewRecipes = []
    for (let recipe of recipesFromSpoonacular){

        let isSaved = await checkDBForRecord(user_id, recipe.id, 'FavoriteRecipes')
        let isWatched = await checkDBForRecord(user_id, recipe.id, 'LastWatched')
        PreviewRecipes.push({
            recipePreview:{
                id: recipe.id,
                title: recipe.title,
                readyInMinutes: recipe.readyInMinutes,
                image: recipe.image,
                popularity: recipe.aggregateLikes,
                vegan: recipe.vegan,
                vegetarian: recipe.vegetarian,
                glutenFree: recipe.glutenFree,
                wasWatched: isWatched,
                savedToFavourites: isSaved
            }
        })
    }
    return PreviewRecipes;
}

exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getThreeRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipeFullDetails = getRecipeFullDetails;
exports.searchForRecipes = searchForRecipes;
exports.getMyRecipesPreview = getMyRecipesPreview;
