$file = 'c:\xampp\htdocs\4D-Signs\customize-script.js'
$s = Get-Content $file -Raw
$counts = @{}
$chars = @('{','}','(',')','[',']','`','"',"'")
foreach ($c in $chars) {
    $pattern = [regex]::Escape($c)
    $counts[$c] = ($s -split $pattern).Count - 1
}
$counts.GetEnumerator() | Sort-Object Name | Format-Table -AutoSize

Write-Host ('{ vs } : {0} vs {1}' -f $counts['{'], $counts['}'])
Write-Host ('( vs ) : {0} vs {1}' -f $counts['('], $counts[')'])
Write-Host ('[ vs ] : {0} vs {1}' -f $counts['['], $counts[']'])
Write-Host ('backticks (`) : {0}' -f $counts['`'])
Write-Host ("singleQuotes (') : {0}" -f $counts["'"])
Write-Host ('doubleQuotes (") : {0}' -f $counts['"'])