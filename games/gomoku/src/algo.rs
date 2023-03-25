use nesbox_utils::{log, prelude::Player};

fn get_shape(
    grid: &Vec<Vec<Option<Player>>>,
    player: Player,
    mut x: usize,
    mut y: usize,
    dx: i32,
    dy: usize,
) -> Vec<u8> {
    let rows = grid.len();
    let mut shape = Vec::with_capacity(6);
    let mut con_none_count = 0;
    let mut con_some_none = 0;
    loop {
        let len = shape.len();

        if x == rows || y == rows || len > 6 || con_some_none == 5 {
            break;
        }

        if let Some(p) = grid[y][x] {
            if p == player {
                con_none_count = 0;
                con_some_none += 1;
                shape.push(1);
            } else {
                break;
            }
        } else if con_none_count == 2 {
            break;
        } else {
            con_none_count += 1;
            con_some_none = 0;
            shape.push(0);
        }

        if dx < 0 && x == 0 {
            break;
        }
        x = (x as i32 + dx) as usize;
        y += dy;
    }

    shape
}

fn match_score(shape: &[u8]) -> i32 {
    match shape[..] {
        [1, 1, 1, 1, 1] => 99999999,
        [0, 1, 1, 1, 1, 0] => 500000,

        [0, 1, 1, 1, 1] => 5000,
        [1, 1, 1, 1, 0] => 5000,
        [1, 0, 1, 1, 1] => 5000,
        [1, 1, 0, 1, 1] => 5000,
        [1, 1, 1, 0, 1] => 5000,
        [0, 1, 1, 0, 1, 0] => 5000,
        [0, 1, 0, 1, 1, 0] => 5000,

        [0, 1, 1, 1, 0] => 5000,

        [1, 1, 1, 0, 0] => 500,
        [0, 0, 1, 1, 1] => 500,
        [1, 1, 0, 1, 0] => 200,
        [0, 0, 1, 1, 0] => 50,
        [0, 1, 1, 0, 0] => 50,
        [0, 0, 1, 0, 0] => 1,
        _ => 0,
    }
}

fn evaluate(grid: &Vec<Vec<Option<Player>>>, player: Player) -> i32 {
    let rows = grid.len();
    let mut score = 0;
    for y in 0..rows {
        for x in 0..rows {
            let shape = get_shape(&grid, player, x, y, 1, 0);
            score += match_score(&shape[..]);
            let shape = get_shape(&grid, player, x, y, 1, 1);
            score += match_score(&shape[..]);
            let shape = get_shape(&grid, player, x, y, 0, 1);
            score += match_score(&shape[..]);
            let shape = get_shape(&grid, player, x, y, -1, 1);
            score += match_score(&shape[..]);
        }
    }
    score
}

fn is_maybe(grid: &Vec<Vec<Option<Player>>>, x: usize, y: usize, player: Player) -> bool {
    let rows = grid.len();
    for i in 0..4 {
        for j in 0..4 {
            let xx = x + i;
            let yy = y + j;
            if xx >= 2
                && yy >= 2
                && xx < rows + 2
                && yy < rows + 2
                && grid[yy - 2][xx - 2] == Some(player)
            {
                return true;
            }
        }
    }
    false
}

fn find_point(grid: &mut Vec<Vec<Option<Player>>>, player: Player) -> (i32, usize, usize) {
    let rows = grid.len();
    let mut result = (i32::MIN, 0, 0);
    for y in 0..rows {
        for x in 0..rows {
            if grid[y][x].is_none() && is_maybe(&grid, x, y, player) {
                grid[y][x] = Some(player);
                let score = evaluate(&grid, player);
                if score > result.0 {
                    result = (score, x, y);
                }
                grid[y][x] = None;
            }
        }
    }
    result
}

fn find_center(grid: &Vec<Vec<Option<Player>>>) -> (usize, usize) {
    let rows = grid.len();
    let half_rows = rows / 2;
    let start = half_rows;
    for i in 0..half_rows {
        for j in 0..half_rows {
            if grid[start + j][start + i].is_none() {
                return (start + i, start + j);
            }
            if grid[start + j][start - i].is_none() {
                return (start - i, start + j);
            }
            if grid[start - j][start + i].is_none() {
                return (start + i, start - j);
            }
            if grid[start - j][start - i].is_none() {
                return (start - i, start - j);
            }
        }
    }
    return (start, start);
}

pub fn find(
    origin_grid: &Vec<Vec<Option<Player>>>,
    player: Player,
    next: Player,
) -> (usize, usize) {
    let mut grid = origin_grid.clone();

    let rows = grid.len();

    let score = evaluate(&grid, player);
    let opponent_score = evaluate(&grid, next);
    let is_advantage = score > opponent_score;

    let start = find_center(&grid);
    let mut result = (i32::MIN, start.0, start.1);

    for y in 0..rows {
        for x in 0..rows {
            if grid[y][x].is_none() && is_maybe(&grid, x, y, player) {
                grid[y][x] = Some(player);
                let next_score = evaluate(&grid, player);
                let opponent_next = find_point(&mut grid, next);
                if is_advantage {
                    let diff = next_score - opponent_next.0;
                    if diff > result.0 {
                        result = (diff, x, y);
                    }
                } else {
                    if opponent_next.0 > result.0 {
                        result = opponent_next;
                    }
                };
                grid[y][x] = None;
            }
        }
    }

    log!("CPU is advantage: {is_advantage}, result: {:?}", result);

    (result.1, result.2)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_board(temp: Vec<Vec<u8>>) -> Vec<Vec<Option<Player>>> {
        let rows = temp.len();
        assert!(rows == temp[0].len(), "rows != cols");
        let mut board = Vec::with_capacity(rows);
        for y in 0..rows {
            board.push(Vec::with_capacity(rows));
            for x in 0..rows {
                board[y].push(match temp[y][x] {
                    1 => Some(Player::One),
                    2 => Some(Player::Two),
                    _ => None,
                });
            }
        }
        board
    }

    #[test]
    fn test_start_1() {
        let board = make_board(vec![
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            vec![0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        ]);
    }
}
