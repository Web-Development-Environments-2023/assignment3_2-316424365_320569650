var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeId;
    await user_utils.markAsFavorite(user_id, recipe_id);
    res.status(200).send("The Recipe successfully saved as favorite");
    } catch(error){
    next(error);
  }
})

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req,res,next) => {
  try{
    const user_id = req.session.user_id;
    let favorite_recipes = {};
    const recipes_id = await user_utils.getFavoriteRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(results);
  } catch(error){
    next(error); 
  }
});



router.get('/familyRecipes', async(req, res, next) => {
  try{
    
    const user_id = req.user_id
    const familyRecipes = await user_utils.getFamilyRecipes(user_id)
    res.status(200).send(familyRecipes)
  }catch(error){
    next(error)
  }
  })
  
  router.use('/familyRecipes', function(err, req, res, next){
    console.log(err.message);
    res.status(401).send("User is unauthorized to enter the page")
  })
  

/**
 * This path returns the recipes created by the logged-in user
 */
router.get('/myRecipes', async(req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipes_id = await user_utils.getMyRecipes(user_id);
    let recipes_id_array = [];
    recipes_id.map((element) => recipes_id_array.push(element.recipe_id)); //extracting the recipe ids into array
    const results = await recipe_utils.getMyRecipesPreview(recipes_id_array, user_id);
    res.status(200).send(results);
  }
  catch(error){
    next(error);
  }
})


/**
 * This path gets body with full relevant details about the recipe and save this recipe in the my recipes list of the logged-in user
 */
router.post('/myRecipes', async(req,res,next) => {
  try{
    const user_id = req.session.user_id;
    const recipePreview = req.body.newRecipePreview;
    const recipeIngredients = req.body.ingredients;
    const recipePrepInstructions = req.body.instructions;
    const numOfDishes = req.body.servings;
    await user_utils.addMyRecipe(user_id, recipePreview, recipeIngredients, recipePrepInstructions, numOfDishes);
    res.status(200).send("user's recipe was successfully added");
    } catch(error){
    next(error);
  }
})


module.exports = router;



