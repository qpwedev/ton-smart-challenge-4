def fibonacci(n, k):
    if n == 0:
        a, b = 0, 1
    else:
        a, b = 1, 1
        for _ in range(2, n):
            a, b = b, a + b

    result = []

    for _ in range(k):
        result.append(b)
        a, b = b, a + b

    return tuple(result)


print(
    fibonacci(201, 4)
)