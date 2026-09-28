async function generateMeals() {
    const currentWeight = document.getElementById("currentWeight").value;
    const goalWeight = document.getElementById("goalWeight").value;
    const pantry = document.getElementById("pantry").value;

    const response = await fetch("https://pyffah5jvd.execute-api.af-south-1.amazonaws.com/default/budgetbites-backend", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            currentWeight,
            goalWeight,
            pantry
        })
    });

    const result = await response.json();

    console.log(result);
}
