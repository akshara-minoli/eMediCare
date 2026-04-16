$deployments = @('doctor-service','admin-service','appointment-service')
foreach ($d in $deployments) {
  $obj = kubectl get deployment $d -n emedicare -o json | ConvertFrom-Json
  Write-Output "=== $d ==="
  foreach ($c in $obj.spec.template.spec.containers) {
    Write-Output "Container: $($c.name)"
    if ($c.env) {
      foreach ($e in $c.env) {
        if ($null -ne $e.value) {
          Write-Output "  $($e.name) = $($e.value)"
        } elseif ($e.valueFrom.secretKeyRef) {
          Write-Output "  $($e.name) = valueFrom.secretKeyRef(name=$($e.valueFrom.secretKeyRef.name), key=$($e.valueFrom.secretKeyRef.key))"
        } elseif ($e.valueFrom.configMapKeyRef) {
          Write-Output "  $($e.name) = valueFrom.configMapKeyRef(name=$($e.valueFrom.configMapKeyRef.name), key=$($e.valueFrom.configMapKeyRef.key))"
        } elseif ($e.valueFrom.fieldRef) {
          Write-Output "  $($e.name) = valueFrom.fieldRef(fieldPath=$($e.valueFrom.fieldRef.fieldPath))"
        } else {
          Write-Output "  $($e.name) = valueFrom(unsupported)"
        }
      }
    } else {
      Write-Output "  (no env vars found)"
    }
  }
}
