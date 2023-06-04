var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/show_details/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeFullDetails(req.params.recipeId, req.session);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});
/**
 * This path returns search results for recipes based on different filters
 */
router.get("/Search", async (req, res, next) => {
  try {
    const recipeName = req.query.recipeName
    const cuisine = req.query.cuisine
    const diet = req.query.diet
    const intolerance = req.query.intolerance
    const amount = req.query.amount

    // if user logged and doesn't have a save search
    if(req.session && (recipeName != undefined ||diet != undefined || intolerance != undefined || cuisine != undefined||amount != undefined ))
    {
      console.log("SAVING USERS SESSION")
      req.session.saved_search = {
        recipeName: recipeName,
        cuisine: cuisine,
        diet: diet,
        intolerance: intolerance,
        amount: amount
      }
    }
    const recipes = await recipes_utils.searchForRecipes(recipeName, cuisine, diet, intolerance, amount, req.session) 
    res.send(recipes)
  } catch (error) {
    next(error);
  }
});

module.exports = router;