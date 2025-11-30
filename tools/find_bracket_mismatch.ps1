$path = 'c:\xampp\htdocs\4D-Signs\customize-script.js'
$s = Get-Content -Raw -Encoding UTF8 $path
$pairs = @{ '(' = ')'; '[' = ']'; '{' = '}' }
$open = $pairs.Keys
$close = $pairs.Values
$stack = @()
for ($i = 0; $i -lt $s.Length; $i++) {
    $ch = $s[$i]
    if ($open -contains $ch) { $stack += [PSCustomObject]@{ch=$ch; pos=$i} }
    elseif ($close -contains $ch) {
        if ($stack.Count -eq 0) { Write-Output "Unmatched closing $ch at pos $i"; exit 1 }
        $top = $stack[$stack.Count - 1]
        $stack = $stack[0..($stack.Count - 2)]
        if ($pairs[$top.ch] -ne $ch) {
            Write-Output "Mismatched $($top.ch) at pos $($top.pos) closed by $ch at pos $i"
            # Print context
            $start = [math]::Max(0, $top.pos - 20)
            $end = [math]::Min($s.Length-1, $i + 20)
            Write-Output $s.Substring($start, $end - $start + 1)
            exit 1
        }
    }
}
if ($stack.Count -gt 0) { foreach ($t in $stack) { Write-Output "Unclosed $($t.ch) at pos $($t.pos)" } exit 1 }
Write-Output 'All brackets matched' 
