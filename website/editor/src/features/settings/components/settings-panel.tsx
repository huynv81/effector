import * as React from 'react'
import {useStore, useStoreMap, useList} from 'effector-react'
import {styled} from 'linaria/react'

import {selectVersion, $packageVersions, $version} from '~/features/editor'
import {Toggle} from '~/ui/toggle'

import {
  $flowToggle,
  $tsToggle,
  $typeHoverToggle,
  flowToggleChange,
  tsToggleChange,
  typeHoverToggleChange,
} from '../model'

export const SettingsPanel = () => (
  <SettingsGroup>
    <Section>
      <Label>
        <div className="versions">
          <select
            value={useStore($version)}
            onChange={event => selectVersion(event.currentTarget.value)}>
            {useList($packageVersions, version => (
              <option value={version}>{version}</option>
            ))}
          </select>
        </div>
        Effector version
      </Label>
    </Section>
    <Section>
      <Label>
        <Toggle
          name="flow"
          checked={useStore($flowToggle)}
          onChange={flowToggleChange}
        />
        Flow
      </Label>
      <Label>
        <Toggle
          name="typescript"
          checked={useStore($tsToggle)}
          onChange={tsToggleChange}
        />
        TypeScript
      </Label>
    </Section>
    <Section>
      <Label>
        <Toggle
          name="typehover"
          checked={useStore($typeHoverToggle)}
          onChange={typeHoverToggleChange}
        />
        Type hover
      </Label>
    </Section>
  </SettingsGroup>
)

const SettingsGroup = styled.div`
  --settings-row-padding: 15px;

  background-color: #f7f7f7;
  border-left: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  grid-column: 3 / span 1;
  grid-row: 2 / span 1;

  @media (max-width: 699px) {
    grid-column: 1 / span 1;
    grid-row: 2 / span 1;
  }
`

const Label = styled.label`
  display: grid;
  grid-gap: 15px;
  grid-template-columns: auto 1fr;
  padding: var(--settings-row-padding);
  border-bottom: 1px solid #ddd;
  font-weight: bold;
  cursor: pointer;
`

export const Section = styled.section`
  background-color: #fff;
  border-bottom: 15px solid #f7f7f7;

  & + & {
    border-top: 1px solid #ddd;
  }
`
