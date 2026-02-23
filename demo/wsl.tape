Output wsl.gif

Set FontSize 14
Set Width 920
Set Height 680
Set Theme "Dracula"
Set Padding 10
Set TypingSpeed 60ms
Set PlaybackSpeed 1

# WSL ホームから全プロバイダ統合で取得
Type "cd ~"
Enter
Sleep 300ms

Type "echo-news --source all --limit 5"
Enter
Sleep 6s

# config show でキー設定と使用状況を確認
Type "echo-news config show"
Enter
Sleep 2s

# カテゴリ絞り込み
Type "echo-news --source currents --category technology --lang en --limit 3"
Enter
Sleep 5s

Type "echo-news --quota"
Enter
Sleep 1500ms
