import json

def lambda_handler(event, context):

    body = json.loads(event.get("body", "{}"))

    current_weight = body.get("currentWeight")
    goal_weight = body.get("goalWeight")
    pantry = body.get("pantry")

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "message": "BudgetBites received your information!",
            "currentWeight": current_weight,
            "goalWeight": goal_weight,
            "pantry": pantry
        })
    }
