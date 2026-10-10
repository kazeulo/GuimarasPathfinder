from floyd import INF, vertices, matrix, find_shortest_path

RED, GREEN, YELLOW, CYAN, RESET = (
    "\033[91m", "\033[92m", "\033[93m", "\033[96m", "\033[0m"
)


def fmt_path(path):
    """Format a 0-based vertex list as 1-based labels."""
    return " -> ".join(str(v + 1) for v in path)


def get_valid_vertex(prompt):
    """Prompt until the user enters a vertex number in 1..vertices."""
    while True:
        try:
            n = int(input(prompt))
        except ValueError:
            print(f"{RED}Please enter a valid integer.{RESET}")
            continue
        if 1 <= n <= vertices:
            return n
        print(f"{RED}Invalid number. Enter 1–{vertices}.{RESET}")


def nearest_neighbor_tour(start=0, return_to_start=True):
    """Greedy tour over all vertices using shortest-path distances.

    Returns (path, total), or (path, None) if some vertex is unreachable.
    """
    unvisited = set(range(vertices)) - {start}
    path = [start]

    while unvisited:
        curr = path[-1]
        nxt = min(unvisited, key=lambda v: matrix[curr][v])
        if matrix[curr][nxt] == INF:
            return path, None
        path.append(nxt)
        unvisited.remove(nxt)

    if return_to_start:
        if matrix[path[-1]][start] == INF:
            return path, None
        path.append(start)

    total = sum(matrix[a][b] for a, b in zip(path, path[1:]))
    return path, total


def show_specific_path():
    start = get_valid_vertex(f"Start point (1–{vertices}): ") - 1
    end = get_valid_vertex(f"End point (1–{vertices}): ") - 1

    if start == end:
        print(f"{CYAN}Path:{RESET} {start + 1}")
        print(f"{CYAN}Distance:{RESET} 0.00 km")
        return

    path = find_shortest_path(start, end)
    if path:
        print(f"{CYAN}Path:{RESET} {fmt_path(path)}")
        print(f"{CYAN}Distance:{RESET} {matrix[start][end]:.2f} km")
    else:
        print(f"{RED}No path found.{RESET}")


def show_all_paths():
    print(f"\n{CYAN}All Shortest Paths (in km):\n{RESET}")
    for i in range(vertices):
        for j in range(vertices):
            if i != j and matrix[i][j] != INF:
                print(
                    f"{i + 1} → {j + 1}: {fmt_path(find_shortest_path(i, j))} "
                    f"(Distance: {matrix[i][j]:.2f} km)"
                )


def show_nn_tour():
    path, total = nearest_neighbor_tour(return_to_start=True)
    print(f"\n{CYAN}Nearest Neighbor Tour (with return):{RESET}")
    print(fmt_path(path))
    if total is None:
        print(f"{RED}Tour incomplete: some vertices are unreachable.{RESET}")
    else:
        print(f"{CYAN}Total Distance:{RESET} {total:.2f} km")


ACTIONS = {
    "1": show_specific_path,
    "2": show_all_paths,
    "3": show_nn_tour,
}


def menu():
    while True:
        print(f"\n{YELLOW}============================={RESET}")
        print(f"  {GREEN}GUIMARAS PATH FINDER MENU{RESET}")
        print(f"{YELLOW}============================={RESET}")
        print("1. Display a specific path")
        print("2. Display all shortest paths")
        print("3. Nearest Neighbor Tour (with return)")
        print("4. Exit\n")

        choice = input("Your choice: ").strip()

        if choice == "4":
            print(f"{GREEN}Exiting...{RESET}")
            break
        action = ACTIONS.get(choice)
        if action:
            action()
        else:
            print(f"{RED}Invalid choice. Try again.{RESET}")


if __name__ == "__main__":
    menu()
