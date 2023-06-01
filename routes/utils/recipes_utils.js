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



async function getRecipeDetails(recipe_id, user_id) {

    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;
    const isWatched = await checkDBForRecord(user_id, recipe_id, 'LastWatched')

    const isSaved = await checkDBForRecord(user_id, recipe_id, 'FavoriteRecipes')
    return {
        recipiePreview:{ 
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
    // return {
    //     recipiePreview:{ 
    //         id: recipe_id,
    //         wasWatched: isWatched,
    //         savedToFavourites: isSaved}
    // }
}

async function getRecipesPreview(recipes_id_array, user_id){
    let res = [];
    let recepiesPreview = [];
    for(recipe_id of recipes_id_array){
        recepiesPreview.push(getRecipeDetails(recipe_id, user_id))
    }
    await Promise.all(recepiesPreview)
        .then((results)=>{
            res = results.map((rec)=>rec.recipiePreview);
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


exports.getRecipeDetails = getRecipeDetails;
exports.getRandomRecipes = getThreeRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;

