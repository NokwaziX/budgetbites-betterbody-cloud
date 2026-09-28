async function generateMeals() {
    const currentWeight = document.getElementById("currentWeight").value;
    const goalWeight = document.getElementById("goalWeight").value;
    const pantry = document.getElementById("pantry").value;

    const response = await fetch("YOUR_API_GATEWAY_URL", {
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
