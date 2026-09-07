<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$action = $_GET['action'] ?? '';
$pollFile = 'poll_data.json';
$votesFile = 'poll_votes.json';
$SECRET = "pollme_secret_2026"; 

switch ($action) {
    case 'get_poll':
        if (file_exists($pollFile)) {
            echo file_get_contents($pollFile);
        } else {
            echo json_encode(["status" => "no_poll"]);
        }
        break;

    case 'set_poll':
        if (($_POST['secret'] ?? '') !== $SECRET) {
            http_response_code(403);
            echo json_encode(["error" => "Unauthorized"]);
            exit;
        }
        
        $oldPoll = file_exists($pollFile) ? json_decode(file_get_contents($pollFile), true) : [];
        $resetTime = ($oldPoll['id'] ?? '') === $_POST['id'] ? ($oldPoll['reset_time'] ?? 0) : 0;

        $pollData = [
            "id" => $_POST['id'] ?? time(),
            "title" => $_POST['title'] ?? '',
            "subtitle" => $_POST['subtitle'] ?? '',
            "type" => $_POST['type'] ?? 'MCQ',
            "options" => json_decode($_POST['options'] ?? '[]', true),
            "timestamp" => time(),
            "reset_time" => $resetTime,
            "status" => "open"
        ];
        
        file_put_contents($pollFile, json_encode($pollData));
        echo json_encode(["status" => "success", "poll" => $pollData]);
        break;

    case 'close_poll':
        if (file_exists($pollFile)) {
            $poll = json_decode(file_get_contents($pollFile), true);
            $poll['status'] = 'closed';
            file_put_contents($pollFile, json_encode($poll));
        }
        echo json_encode(["status" => "success"]);
        break;

    case 'vote':
        $pollId = $_POST['poll_id'] ?? '';
        $deviceId = $_POST['device_id'] ?? '';
        $choice = $_POST['choice'] ?? '';
        
        if (!$pollId || !$deviceId || !$choice) {
            http_response_code(400);
            echo json_encode(["error" => "Missing data"]);
            exit;
        }

        $votes = file_exists($votesFile) ? json_decode(file_get_contents($votesFile), true) : [];
        if (!is_array($votes)) $votes = [];
        
        if (!isset($votes[$pollId])) {
            $votes[$pollId] = [];
        }
        $votes[$pollId][$deviceId] = $choice;
        
        file_put_contents($votesFile, json_encode($votes));
        echo json_encode(["status" => "success"]);
        break;

    case 'get_votes':
        $pollId = $_GET['poll_id'] ?? '';
        if (file_exists($votesFile)) {
            $votes = json_decode(file_get_contents($votesFile), true);
            $pollVotes = $votes[$pollId] ?? [];
            
            $tallies = [];
            foreach ($pollVotes as $device => $choice) {
                if (!isset($tallies[$choice])) $tallies[$choice] = 0;
                $tallies[$choice]++;
            }
            
            echo json_encode(["total" => count($pollVotes), "tallies" => $tallies]);
        } else {
            echo json_encode(["total" => 0, "tallies" => []]);
        }
        break;

    case 'clear_poll':
        $pollId = $_GET['poll_id'] ?? '';
        $votes = file_exists($votesFile) ? json_decode(file_get_contents($votesFile), true) : [];
        if (isset($votes[$pollId])) {
            unset($votes[$pollId]);
            file_put_contents($votesFile, json_encode($votes));
        }
        
        if (file_exists($pollFile)) {
            $poll = json_decode(file_get_contents($pollFile), true);
            if (($poll['id'] ?? '') === $pollId) {
                $poll['reset_time'] = time(); $poll['reset_all_time'] = time();
                file_put_contents($pollFile, json_encode($poll));
            }
        }
        echo json_encode(["status" => "success"]);
        break;

    case 'clear_all':
        file_put_contents($votesFile, json_encode([]));
        if (file_exists($pollFile)) {
            $poll = json_decode(file_get_contents($pollFile), true);
            $poll['reset_time'] = time(); $poll['reset_all_time'] = time();
            file_put_contents($pollFile, json_encode($poll));
        }
        echo json_encode(["status" => "success"]);
        break;

    default:
        echo json_encode(["error" => "Invalid action"]);
        break;
}
