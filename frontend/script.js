const API_URL = "https://pyffah5jvd.execute-api.af-south-1.amazonaws.com/default/budgetbites-backend";
const MAX_IMAGE_SIDE = 1024;

const button = document.getElementById("generateBtn");
const errorBox = document.getElementById("error");
const results = document.getElementById("results");
const photoInput = document.getElementById("mealPhoto");
const preview = document.getElementById("preview");

let imageBase64 = null;

photoInput.addEventListener("change", async () => {
    imageBase64 = null;
    preview.style.display = "none";
    const file = photoInput.files[0];
    if (!file) {
        return;
    }
    try {
        imageBase64 = await shrinkImage(file);
        preview.src = "data:image/jpeg;base64," + imageBase64;
        preview.style.display = "block";
    } catch (error) {
        errorBox.textContent = "Could not read that image. Try a different photo.";
    }
});

button.addEventListener("click", generateMeals);

function shrinkImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.8).split(",")[1]);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("bad image"));
        };
        img.src = url;
    });
}

function readForm() {
    return {
        currentWeight: document.getElementById("currentWeight").value,
        goalWeight: document.getElementById("goalWeight").value,
        height: document.getElementById("height").value,
        age: document.getElementById("age").value,
        sex: document.getElementById("sex").value,
        activity: document.getElementById("activity").value,
        pace: document.getElementById("pace").value,
        weeklyBudgetZar: document.getElementById("weeklyBudgetZar").value,
        pantry: document.getElementById("pantry").value,
        imageBase64
    };
}

async function generateMeals() {
    errorBox.textContent = "";
    results.classList.add("hidden");
    button.disabled = true;
    button.textContent = "Working on it...";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(readForm())
        });
        const result = await response.json();

        if (!response.ok) {
            const details = result.details ? "\n" + result.details.join("\n") : "";
            errorBox.textContent = (result.error || "Something went wrong.") + details;
            if (result.plan) {
                renderResults(result.plan, null);
            }
            return;
        }

        renderResults(result.plan, result.meals);
    } catch (error) {
        errorBox.textContent = "Could not reach the server. Check your connection and try again.";
    } finally {
        button.disabled = false;
        button.textContent = "Generate my plan";
    }
}

function el(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) {
        node.textContent = text;
    }
    if (className) {
        node.className = className;
    }
    return node;
}

function list(tag, items) {
    const node = document.createElement(tag);
    (items || []).forEach((item) => node.appendChild(el("li", String(item))));
    return node;
}

function card(title) {
    const wrapper = el("div", null, "card");
    wrapper.appendChild(el("h2", title));
    return wrapper;
}

function stat(label, value) {
    const box = el("div", null, "stat");
    box.appendChild(el("strong", String(value)));
    box.appendChild(el("span", label, "tag"));
    return box;
}

function renderResults(plan, meals) {
    results.replaceChildren();

    const planCard = card("Your daily targets");
    const stats = el("div", null, "stats");
    stats.appendChild(stat("kcal per day", plan.targetCalories));
    stats.appendChild(stat("protein (g)", plan.proteinG));
    stats.appendChild(stat("carbs (g)", plan.carbsG));
    stats.appendChild(stat("fat (g)", plan.fatG));
    planCard.appendChild(stats);
    planCard.appendChild(
        el("p", "Maintenance is about " + plan.maintenanceCalories + " kcal per day. Resting burn (BMR) is about " + plan.bmr + " kcal.", "tag")
    );
    if (plan.weeksToGoal) {
        planCard.appendChild(el("p", "At this pace you would reach your goal in about " + plan.weeksToGoal + " weeks.", "tag"));
    }
    (plan.notes || []).forEach((note) => planCard.appendChild(el("p", note, "tag")));
    results.appendChild(planCard);

    if (meals) {
        const mealCard = card("Meal ideas for one day");
        (meals.mealIdeas || []).forEach((meal) => {
            const block = el("div", null, "meal");
            block.appendChild(el("h3", (meal.meal || "Meal") + ": " + (meal.name || "")));
            block.appendChild(
                el(
                    "div",
                    (meal.estimatedCalories || "?") + " kcal, " + (meal.estimatedProteinG || "?") + " g protein, about R" + (meal.estimatedCostZar || "?"),
                    "tag"
                )
            );
            block.appendChild(el("strong", "Ingredients"));
            block.appendChild(list("ul", meal.ingredients));
            block.appendChild(el("strong", "Steps"));
            block.appendChild(list("ol", meal.steps));
            mealCard.appendChild(block);
        });
        results.appendChild(mealCard);

        if (meals.shoppingList && meals.shoppingList.length) {
            const shopCard = card("Shopping list");
            shopCard.appendChild(
                list("ul", meals.shoppingList.map((entry) => entry.item + " (about R" + entry.estimatedCostZar + ")"))
            );
            results.appendChild(shopCard);
        }

        if (meals.mealPhotoAnalysis) {
            const photo = meals.mealPhotoAnalysis;
            const photoCard = card("Your meal photo");
            photoCard.appendChild(el("p", "Foods seen: " + (photo.foodsSeen || []).join(", ")));
            photoCard.appendChild(el("p", "Estimated calories: " + photo.estimatedCalories));
            photoCard.appendChild(el("p", photo.portionNotes));
            photoCard.appendChild(el("p", photo.feedback));
            results.appendChild(photoCard);
        }

        if (meals.tips && meals.tips.length) {
            const tipsCard = card("Money-saving tips");
            tipsCard.appendChild(list("ul", meals.tips));
            results.appendChild(tipsCard);
        }
    }

    results.classList.remove("hidden");
    results.scrollIntoView({ behavior: "smooth" });
}
