$s = Get-Content -Raw -Encoding UTF8 'c:\xampp\htdocs\4D-Signs\customize-script.js'
$pairs = @{ '(' = ')'; '[' = ']'; '{' = '}' }
$opening = $pairs.Keys
$closing = $pairs.Values
$stack = New-Object System.Collections.Generic.Stack[object]
for ($i = 0; $i -lt $s.Length; $i++) {
    $ch = $s[$i]
    if ($opening -contains $ch) { $stack.Push([PSCustomObject]@{ch=$ch; pos=$i+1}) }
    elseif ($closing -contains $ch) {
        if ($stack.Count -eq 0) { Write-Output "Unmatched closing $ch at position $($i+1)"; exit 1 }
        $top = $stack.Pop()
        if ($pairs[$top.ch] -ne $ch) { Write-Output "Mismatched $($top.ch) at $($top.pos) closed by $ch at $($i+1)"; exit 1 }
    }
}
if ($stack.Count -gt 0) { foreach ($t in $stack) { Write-Output "Unclosed $($t.ch) at $($t.pos)" } exit 1 }
Write-Output 'All brackets matched'