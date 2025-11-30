$path = 'c:\xampp\htdocs\4D-Signs\customize-script.js'
$s = Get-Content -Raw -Encoding UTF8 $path
for ($i=0; $i -lt 120; $i++) {
    $c = $s[$i]
    $code = [int][char]$c
    Write-Output ("$($i+1): [${c}|$code]")
}