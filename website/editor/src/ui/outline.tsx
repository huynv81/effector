import React from 'react'
import {Store, Event, Effect, Domain} from 'effector'
import {StoreView} from 'effector-react'
import {styled, StyledComponent} from 'linaria/react'

interface Location {
  file: string
  line: number
  column: number
}

interface ItemSpec {
  defaultConfig?: {
    loc?: Location
  }
  compositeName?: {
    fullName?: string
  }
  shortName?: string
  id?: string
  kind?: string
  displayName?: string
}

interface OutlineProps {
  style?: object
  className?: string
  event: Event<any>[]
  store: Store<any>[]
  effect: Effect<any, any, any>[]
  domain: Domain[]
  component: StoreView<any, any>[]
  onItemClick: (location: Location) => void
}

export const Outline: React.FC<OutlineProps> = ({
  className,
  component,
  domain,
  effect,
  event,
  onItemClick,
  store,
  style,
}) => {
  const isEmpty =
    event.length === 0 &&
    effect.length === 0 &&
    store.length === 0 &&
    domain.length === 0 &&
    component.length === 0

  return (
    <OutlineContainer id="outline-sidebar" style={style} className={className}>
      {isEmpty ? (
        <EmptySection>Symbols weren&apos;t found in this share</EmptySection>
      ) : (
        <>
          <OutlineSection
            title="Events"
            list={event}
            onItemClick={onItemClick}
          />
          <OutlineSection
            title="Effects"
            list={effect}
            onItemClick={onItemClick}
          />
          <OutlineSection
            title="Stores"
            list={store}
            onItemClick={onItemClick}
          />
          <OutlineSection
            title="Domains"
            list={domain}
            onItemClick={onItemClick}
          />
          <OutlineSection
            title="Components"
            list={component}
            onItemClick={onItemClick}
          />
        </>
      )}
    </OutlineContainer>
  )
}

interface SectionProps {
  list: ItemSpec[]
  title: string
  onItemClick: (location: Location) => void
}

const OutlineSection: React.FC<SectionProps> = ({list, title, onItemClick}) => {
  if (list.length === 0) return null

  return (
    <>
      <Header>{title}</Header>
      <Section>
        <ol>
          {list.map((unit, index) => {
            const loc = unit.defaultConfig?.loc
            const onClick = () => {
              if (loc) onItemClick(loc)
            }

            return (
              <Item loc={loc} onClick={onClick} key={createKey(unit, index)}>
                {name}
              </Item>
            )
          })}
        </ol>
      </Section>
    </>
  )
}

function createKey(unit: ItemSpec, index: number): string {
  const name =
    unit.compositeName?.fullName ||
    unit.shortName ||
    unit.id ||
    unit.displayName
  const key = unit.kind && unit.id ? `${unit.kind}${unit.id}${name}` : name

  return `${key} ${index}`
}

interface ItemProps {
  loc?: Location
  onClick: () => void
}

const Item: StyledComponent<ItemProps> = styled.li`
  cursor: ${props => (Boolean(props.loc) ? 'pointer' : 'inherit')};
`

const OutlineContainer = styled.div`
  grid-column: 1 / span 1;
  grid-row: 2 / span 1;
  background-color: #fff;
  border-bottom: 1px solid #ddd;
  font-size: 0.8rem;
  overflow: auto;

  @media (min-width: 700px) {
    grid-column: 1 / span 1;
    grid-row: 1 / span 3;
  }
`

const Header = styled.div`
  padding: 3px 5px;
  background: #f7f7f7;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
`

const Section = styled.section`
  padding: 5px;
`

const EmptySection = styled.section`
  padding: 15px;
`
