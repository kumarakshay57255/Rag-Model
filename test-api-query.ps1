$body = @{
    query = "What is Lark Finserv?"
    topK = 3
} | ConvertTo-Json

try {
    Write-Host "`n Testing /api/query endpoint...`n" -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/query" -Method Post -Body $body -ContentType "application/json"
    
    Write-Host " Query successful!`n" -ForegroundColor Green
    Write-Host "Query: $($response.query)" -ForegroundColor Yellow
    Write-Host "Results found: $($response.results.Count)`n" -ForegroundColor Yellow
    
    if ($response.message) {
        Write-Host "Message: $($response.message)" -ForegroundColor Red
    }
    
    if ($response.results.Count -gt 0) {
        for ($i = 0; $i -lt $response.results.Count; $i++) {
            $result = $response.results[$i]
            Write-Host "Result $($i + 1):" -ForegroundColor Cyan
            Write-Host "  Source: $($result.source)"
            Write-Host "  Similarity: $([math]::Round($result.similarity * 100, 2))%"
            Write-Host "  Content: $($result.content.Substring(0, [Math]::Min(150, $result.content.Length)))...`n"
        }
    }
} catch {
    Write-Host " Error occurred" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
