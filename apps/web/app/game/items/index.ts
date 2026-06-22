import type { Equipment, EquipmentItemDefinition, ItemDefinition } from '../types'
import { AnelDaVelocidade } from './AnelDaVelocidade'
import { AnelDeCobre } from './AnelDeCobre'
import { AnelDoPoder } from './AnelDoPoder'
import { ArmaduraDeCouro } from './ArmaduraDeCouro'
import { ArmaduraDePlacas } from './ArmaduraDePlacas'
import { ArmaduraDraconica } from './ArmaduraDraconica'
import { CajadoDeCarvalho } from './CajadoDeCarvalho'
import { CajadoDeFogo } from './CajadoDeFogo'
import { Capuz } from './Capuz'
import { CoroaDoRei } from './CoroaDoRei'
import { CotaDeMalha } from './CotaDeMalha'
import { ElmoDeFerro } from './ElmoDeFerro'
import { EspadaDeAco } from './EspadaDeAco'
import { EspadaDeFerro } from './EspadaDeFerro'
import { Excalibur } from './Excalibur'
import { Galho } from './Galho'
import { Gold } from './Gold'
import { LaminaSombria } from './LaminaSombria'
import { PocaoDeVida } from './PocaoDeVida'
import { RoupaDeTecido } from './RoupaDeTecido'
import { ArcoDoCacador } from './ArcoDoCacador'
import { NucleoBaixo } from './NucleoBaixo'
import { NucleoMedio } from './NucleoMedio'
import { NucleoAlto } from './NucleoAlto'
import { NucleoAltissimo } from './NucleoAltissimo'
import { NucleoBaixoPerfeito } from './NucleoBaixoPerfeito'
import { NucleoMedioPerfeito } from './NucleoMedioPerfeito'
import { NucleoAltoPerfeito } from './NucleoAltoPerfeito'
import { NucleoAltissimoPerfeito } from './NucleoAltissimoPerfeito'

export const ITEM_CATALOG: ItemDefinition[] = [
  Galho,
  EspadaDeFerro,
  ArcoDoCacador,
  CajadoDeCarvalho,
  EspadaDeAco,
  CajadoDeFogo,
  LaminaSombria,
  Excalibur,
  RoupaDeTecido,
  ArmaduraDeCouro,
  CotaDeMalha,
  ArmaduraDePlacas,
  ArmaduraDraconica,
  Capuz,
  ElmoDeFerro,
  CoroaDoRei,
  AnelDeCobre,
  AnelDaVelocidade,
  AnelDoPoder,
  PocaoDeVida,
  Gold,
  NucleoBaixo,
  NucleoMedio,
  NucleoAlto,
  NucleoAltissimo,
  NucleoBaixoPerfeito,
  NucleoMedioPerfeito,
  NucleoAltoPerfeito,
  NucleoAltissimoPerfeito,
]

export const EQUIPMENT_POOL: Equipment[] = ITEM_CATALOG
  .filter((item): item is EquipmentItemDefinition => item.category === 'equipment')
  .map(item => ({
    id: item.id,
    name: item.name,
    slot: item.slot,
    rarity: item.rarity,
    bonuses: item.bonuses,
    icon: item.icon,
    requiredLevel: item.requiredLevel,
  }))

export const ITEM_BY_ID: Record<string, ItemDefinition> = Object.fromEntries(
  ITEM_CATALOG.map(item => [item.id, item])
)
