const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";



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



async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        recepiePreview:{
            id: id,
            title: title,
            readyInMinutes: readyInMinutes,
            image: image,
            popularity: aggregateLikes,
            vegan: vegan,
            vegetarian: vegetarian,
            glutenFree: glutenFree,

        }
    }    
}


async function getRecipesPreview(recipes_id_array, user_id){
    let res = [];
    let recepiesPreview = [];
    recipes_id_array.forEach(recipe_id => {
        recepiesPreview.push(getRecipeDetails(recipe_id));
    });
    await Promise.all(recepiesPreview)
        .then((results)=>{
            res = results.map((rec)=>rec.recepiePreview);
        });
    return res;
    //qdadadsdsa
}


exports.getRecipeDetails = getRecipeDetails;
exports.getRecipesPreview = getRecipesPreview;


