---
title: "C++ Ranges Worksheet for Beginners"
topic: "C++ Ranges"
---

## What Are Ranges?

Think of ranges as an **assembly line in a factory**.

You have raw materials (your data), and instead of manually picking up each piece, inspecting it, modifying it, and placing it in a new box, you set up a conveyor belt with stations. Each station does one thing. The materials flow through automatically.

**Old way (manual loop):**

```cpp
bsl::vector<int> input = {1, 2, 3, 4, 5};
bsl::vector<int> output;
for (int i = 0; i < input.size(); ++i) {
    output.push_back(input[i] * 2);
}
```

**Ranges way (assembly line):**

```cpp
bsl::vector<int> output =
    input
    | ranges::views::transform([](int x) { return x * 2; })
    | std::ranges::to<bsl::vector>;
```

The `|` (pipe) operator is your conveyor belt connecting stations together. Data flows left to right, just like you'd read a sentence.

## Key Vocabulary

| Term | What It Means | Analogy |
|---|---|---|
| **Range** | Anything you can iterate over (vectors, arrays, lists) | A tray of items |
| **View** | A lazy transformation - doesn't copy data, just changes how you see it | Colored glasses - items don't change, you just see them differently |
| **`transform`** | Apply a function to each element | A station that modifies each item |
| **`filter`** | Keep only elements that pass a test | A quality control station that rejects bad items |
| **`\|`** | Pipe operator - chains operations together | The conveyor belt connecting stations |
| **`std::ranges::to<>`** | Collect results into a concrete container | The box at the end of the assembly line |

## The Core Pattern

This is the pattern you're building toward. Memorize this shape:

```cpp
auto result = source_container
    | ranges::views::OPERATION(some_function)
    | std::ranges::to<destination_container_type>;
```

Three parts:

- **Source** - where the data comes from
- **Operations** - what you do to each item (can chain multiple)
- **Collect** - gather results into a new container

## Section 1: `transform` - The Workhorse

`transform` takes each element and converts it into something else. One in, one out.

**Analogy:** A translator at the UN. Each delegate speaks, the translator converts it to another language. The number of speeches doesn't change - each one just gets translated.

**Example 1: Double every number**

```cpp
std::vector<int> prices = {10, 20, 30, 40, 50};

auto doubled = prices
    | std::ranges::views::transform([](int p) { return p * 2; })
    | std::ranges::to<std::vector>();

// doubled is now {20, 40, 60, 80, 100}
```

**Example 2: Using a named function instead of a lambda**

Define a function that handles **one item**, then use `transform` to apply it to everything.

```cpp
std::string formatPrice(int cents) {
    return "$" + std::to_string(cents / 100) + "." + std::to_string(cents % 100);
}

auto formatted = prices
    | std::ranges::views::transform(formatPrice)
    | std::ranges::to<std::vector>();
// {"$0.10", "$0.20", "$0.30", "$0.40", "$0.50"}
```

1. Write a function `celsiusToFahrenheit` that converts a single temperature, then use `transform` to convert a whole vector. Formula: (celsius * 9/5) + 32. Input: `{0.0, 100.0, 37.0, -40.0}`. Expected output: `{32, 212, 98.6, -40}`.

> ```cpp
> ```

## Section 2: `filter` - Keep Only What You Want

`filter` takes a predicate (a function that returns true/false) and keeps only elements where it returns true.

**Analogy:** A bouncer at a club. Everyone in line walks up, the bouncer checks the condition ("Are you on the list?"), and only lets matching people through.

```cpp
std::vector<int> numbers = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

auto evens = numbers
    | std::ranges::views::filter([](int n) { return n % 2 == 0; })
    | std::ranges::to<std::vector>();
// evens = {2, 4, 6, 8, 10}
```

**Chaining filter and transform:**

```cpp
auto result = numbers
    | std::ranges::views::filter([](int n) { return n > 3; })
    | std::ranges::views::transform([](int n) { return n * 10; })
    | std::ranges::to<std::vector>();
// result = {40, 50, 60, 70, 80, 90, 100}
```

Read it like English: "Take numbers, keep only those greater than 3, multiply each by 10, collect into a vector."

2. Given a list of exam scores, keep only passing scores (>= 60), then convert each to a letter grade (90+ = "A", 80-89 = "B", 70-79 = "C", 60-69 = "D"). Input: `{95, 42, 78, 88, 55, 63, 91, 70}`. Expected output: `{"A", "C", "B", "D", "A", "C"}`.

> ```cpp
> ```

## Section 3: Type Translation

This is the most powerful and common use of ranges in production code. You have a collection of **Type A** objects and need to convert them to **Type B** objects.

**Analogy:** You work at an international shipping company. Orders come in from a foreign system in their format. Your system needs them in YOUR format. You write a translator for ONE order, then use the assembly line to translate ALL of them.

```cpp
struct ExternalOrder {
    std::string product_code;
    int quantity;
    double price_euros;
};

struct InternalOrder {
    std::string sku;
    int qty;
    double priceUsd;
};

InternalOrder translateOrder(const ExternalOrder& ext) {
    InternalOrder internal;
    internal.sku      = "SKU-" + ext.product_code;
    internal.qty      = ext.quantity;
    internal.priceUsd = ext.price_euros * 1.08;
    return internal;
}

std::vector<InternalOrder> ourOrders =
    externalOrders
    | std::ranges::views::transform(translateOrder)
    | std::ranges::to<std::vector>();
```

3. You have a vector of raw sensor readings and need to convert them to display-friendly summaries. Write the translate function and the ranges pipeline.

```cpp
struct SensorReading {
    std::string sensorId;
    double tempCelsius;
    bool isOnline;
};

struct DisplaySummary {
    std::string label;       // "Sensor: " + sensorId
    std::string temperature; // celsius as string + " C"
    std::string status;      // "ONLINE" or "OFFLINE"
};
```

> ```cpp
> ```

## Section 4: Other Useful Views

Here are a few more views you'll encounter. Same conveyor-belt idea, different stations.

**`take`** - Grab the first N items:

```cpp
auto firstThree = numbers
    | std::ranges::views::take(3)
    | std::ranges::to<std::vector>();
```

**`drop`** - Skip the first N items:

```cpp
auto afterThree = numbers
    | std::ranges::views::drop(3)
    | std::ranges::to<std::vector>();
```

**`enumerate`** - Get index + value (C++23):

```cpp
for (auto [index, value] : numbers | std::ranges::views::enumerate) {
    std::cout << index << ": " << value << "\n";
}
```

**`keys` / `values`** - Extract from maps:

```cpp
std::map<std::string, int> ages = {{"Alice", 30}, {"Bob", 25}};

auto names = ages
    | std::ranges::views::keys
    | std::ranges::to<std::vector>();
// {"Alice", "Bob"}
```

## Knowledge Check

4. What does `transform` do?

- [ ] Removes elements that don't match a condition
- [ ] Applies a function to each element, producing a new element for each
- [ ] Sorts the elements
- [ ] Groups elements together

5. What does the `|` operator do in a ranges pipeline?

- [ ] Performs a bitwise OR
- [ ] Chains operations together, passing data from left to right
- [ ] Runs operations in parallel
- [ ] Checks if either side is true

6. Why is it better to write a function that handles ONE item and use `transform`, rather than writing a loop?

> ___

7. What's wrong with this code? Explain the issue and how to fix it.

```cpp
auto result = numbers
    | std::ranges::views::transform([](int n) { return n * 2; });
// trying to use result as a std::vector<int>
```

> ___

> **Hint:** Think about what `transform` returns without `to<>`.

8. Rewrite this loop using ranges:

```cpp
std::vector<std::string> names = {"alice", "bob", "charlie"};
std::vector<std::string> uppercased;
for (const auto& name : names) {
    std::string upper = name;
    upper[0] = toupper(upper[0]);
    uppercased.push_back(upper);
}
```

> ```cpp
> ```

9. Given this struct and function, write the ranges pipeline to convert `apiErrors` into a `std::vector<UserFriendlyError>`:

```cpp
struct ApiError {
    int code;
    std::string message;
};

struct UserFriendlyError {
    std::string display;
};

UserFriendlyError translateError(const ApiError& err) {
    return {"Error " + std::to_string(err.code) + ": " + err.message};
}

std::vector<ApiError> apiErrors = { {404, "Not Found"}, {500, "Server Error"} };
```

> ```cpp
> ```

## Final Exercise: Putting It All Together

You have a list of trade executions. Write a complete program that filters out cancelled trades, translates each remaining trade into a summary report, and collects into a vector.

```cpp
struct Trade {
    std::string ticker;
    double price;
    int quantity;
    bool cancelled;
};

struct TradeReport {
    std::string description; // "BOUGHT {quantity} shares of {ticker}"
    double totalValue;       // price * quantity
};
```

10. Write the `translateTrade` function and the full filter + transform pipeline. Expected output (3 reports from input with 2 cancelled trades): `"BOUGHT 100 shares of AAPL" -> 15000.0`, `"BOUGHT 50 shares of MSFT" -> 15000.0`, `"BOUGHT 5 shares of AMZN" -> 16500.0`.

> ```cpp
> ```

## TL;DR - The One Pattern to Remember

```cpp
auto translateOneThing(const InputType& in) {
    OutputType out;
    // ... translate ...
    return out;
}

auto results = inputs
    | ranges::views::transform(translateOneThing)
    | std::ranges::to<bsl::vector>;
```

Define a function that handles **one item**. Use ranges to apply it to **all items**. That's it.
