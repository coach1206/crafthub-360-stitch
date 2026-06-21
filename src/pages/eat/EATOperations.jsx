import { useEffect, useState } from 'react'
import { ManagementLayout } from '../../components/eat/ui.jsx'
import { subscribe } from '../../services/shared/opsEventBus.js'
import { getOperationsSnapshot } from '../../services/eat/eatOperationsService.js'
import StationHealthPanel from '../../components/eat/StationHealthPanel.jsx'
import HumidorHealthPanel from '../../components/eat/HumidorHealthPanel.jsx'
import KitchenBarLoadPanel from '../../components/eat/KitchenBarLoadPanel.jsx'
import OperationsAlertPanel from '../../components/eat/OperationsAlertPanel.jsx'

export default function EATOperations() {
  const [snapshot, setSnapshot] = useState(() => getOperationsSnapshot())

  function refresh() { setSnapshot(getOperationsSnapshot()) }
  useEffect(() => subscribe(() => refresh()), [])

  return (
    <ManagementLayout title="E.A.T. Operations" subtitle="Kitchen/bar load, humidor health, inventory watchlist, alerts">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <StationHealthPanel stationLoad={snapshot.stationLoad} />
        <HumidorHealthPanel humidorHealth={snapshot.humidorHealth} />
        <KitchenBarLoadPanel inventoryHealth={snapshot.inventoryHealth} />
        <OperationsAlertPanel alerts={snapshot.alerts} />
      </div>
    </ManagementLayout>
  )
}
