import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

with patch("boto3.client", return_value=MagicMock()):
    import lambda_function as lf


def base_input(**overrides):
    data = {
        "currentWeight": 90,
        "goalWeight": 75,
        "height": 175,
        "age": 28,
        "sex": "male",
        "activity": "light",
        "pace": "0.5",
        "pantry": "rice, eggs, canned beans",
    }
    data.update(overrides)
    return data


def test_valid_input_passes():
    data, errors = lf.validate(base_input())
    assert errors == []
    assert data["sex"] == "male"


def test_bad_age_rejected():
    _, errors = lf.validate(base_input(age=10))
    assert errors


def test_empty_pantry_rejected():
    _, errors = lf.validate(base_input(pantry="  "))
    assert errors


def test_weight_loss_target_is_below_maintenance():
    data, _ = lf.validate(base_input())
    plan = lf.calculate_plan(data)
    assert plan["targetCalories"] < plan["maintenanceCalories"]
    assert plan["weeksToGoal"] is not None


def test_calorie_floor_applied():
    data, _ = lf.validate(base_input(currentWeight=55, goalWeight=45, height=155, age=60, sex="female", activity="sedentary", pace="1"))
    plan = lf.calculate_plan(data)
    assert plan["targetCalories"] >= 1200
    assert plan["notes"]


def test_extract_json_strips_fences():
    text = "```json\n{\"a\": 1}\n```"
    assert lf.extract_json(text) == {"a": 1}


def test_handler_returns_400_on_bad_input():
    result = lf.lambda_handler({"body": "{}"}, None)
    assert result["statusCode"] == 400


def test_handler_success_with_mocked_model():
    with patch.object(lf, "call_model", return_value={"mealIdeas": []}):
        event = {"body": __import__("json").dumps(base_input())}
        result = lf.lambda_handler(event, None)
    assert result["statusCode"] == 200
